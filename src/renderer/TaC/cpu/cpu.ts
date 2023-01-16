import {
  IDataBus,
  IIntrController,
  IIOHostController,
  IRegister,
  IPsw,
  IPrivModeSignal,
} from '../interface';
import { Alu } from './alu';
import { Instruction } from './instruction';
import { TlbMissError } from '../error';
import * as addrmode from './const/addrmode';
import * as flag from './const/flag';
import * as opcode from './const/opcode';
import * as regNum from './const/regNum';
import * as intr from '../interrupt/interruptKind';

const INTERRUPT_VECTOR = 0xffe0;

export class Cpu {
  private memory: IDataBus;
  private register: IRegister;
  private psw: IPsw;
  private privSig: IPrivModeSignal;
  private intrHost: IIntrController;
  private ioHost: IIOHostController;
  private alu: Alu;

  private isHalt: boolean;

  constructor(
    memory: IDataBus,
    register: IRegister,
    psw: IPsw,
    privSig: IPrivModeSignal,
    intrHost: IIntrController,
    ioHost: IIOHostController
  ) {
    this.memory = memory;
    this.register = register;
    this.psw = psw;
    this.privSig = privSig;
    this.intrHost = intrHost;
    this.ioHost = ioHost;
    this.alu = new Alu(intrHost);

    this.isHalt = false;
  }

  /**
   * 次の手順で命令を1つフェッチして実行する
   * 1. 割込み・例外の確認
   * 2. 命令フェッチ
   * 3. 命令デコード(実行される命令を表すInstructionオブジェクトの生成)
   * 4. 実効アドレス計算
   * 5. 命令実行
   *
   * @returns 実行した命令のInstructionオブジェクトを返すか、何も返さない
   */
  run(): Instruction | undefined {
    if (this.isHalt) {
      // HALT命令が呼び出されているなら何も実行しない
      return;
    }

    if (this.psw.checkFlag(flag.ENABLE_INTR) || this.intrHost.isExceptionOccurred()) {
      // 割込み許可フラグが1 or 例外発生ならば割込みの確認を行う
      const intrNum = this.intrHost.checkIntrNum();

      if (intrNum !== null) {
        // intrNumがnullでないなら割込みが発生している
        this.handleInterrupt(intrNum);
      }
    }

    // 命令フェッチ(TLBミスが発生する可能性有り)
    let instData = 0;
    try {
      instData = this.memory.fetch(this.psw.getPC());
    } catch (e) {
      if (e instanceof TlbMissError) {
        // TLBMissが発生したのでPCを進めずに一旦戻す
        return;
      }
    }

    // 命令デコード(TLBミスが発生する可能性有り)
    const inst = this.decode(instData);

    // 実効アドレス計算
    try {
      inst.ea = this.calcEffectiveAddress(inst.addrMode, inst.rx);
    } catch (e) {
      if (e instanceof TlbMissError) {
        return;
      }
    }

    // 命令実行(TLBミスが発生する可能性有り)
    try {
      this.execInstruction(inst);
    } catch (e) {
      if (e instanceof TlbMissError) {
        // eslint-disable-next-line
        return;
      }
    }

    return inst;
  }

  /**
   * 命令デコード
   *
   * @param data Mem[PC]から取得したデータ
   * @return 命令オブジェクト
   */
  private decode(data: number): Instruction {
    const inst: Instruction = {
      opcode: data >>> 11,
      addrMode: (data >>> 8) & 0x07,
      rd: (data >>> 4) & 0x0f,
      rx: data & 0x0f,
      ea: 0,
    };

    return inst;
  }

  /**
   * 実効アドレス計算
   * TLB Missの可能性アリ
   *
   * @param addrMode アドレッシングモード
   * @param rx インデクスレジスタ
   * @return 対象となるアドレス. 1ワード命令の時は0を返す
   */
  private calcEffectiveAddress(addrMode: number, rx: number): number {
    // 現在のPCから1ワード進んだ箇所のメモリを読み込む
    // (TLBMissを考慮してPCへの加算は最後に回す)
    const data = this.memory.read16(this.psw.getPC() + 2);

    switch (addrMode) {
      case addrmode.DIRECT:
        return data; // MEM[PC + 2]の値
      case addrmode.INDEXED:
        return data + this.readReg(rx); // MEM[PC + 2] + rxレジスタの中身の値
      case addrmode.FP_RELATIVE:
        return (this.readReg(regNum.FP) + this.extSignedInt4(rx) * 2) & 0xffff; // FPの値 + rxの値 * 2
      case addrmode.REG_INDIRECT:
      case addrmode.BYTE_REG_INDIRECT:
        return this.readReg(rx); // rxレジスタの中身の値
      default:
        return 0; // 1ワード命令
    }
  }

  /**
   * オペランド読み出し
   * TLB Missの可能性アリ
   *
   * @param addrMode アドレッシングモード
   * @param rx インデクスレジスタ
   * @param dsp 実効アドレス
   * @return 読み出した値
   */
  private loadOperand(addrMode: number, rx: number, dsp: number): number {
    switch (addrMode) {
      case addrmode.DIRECT:
        return this.memory.read16(dsp);
      case addrmode.INDEXED:
        return this.memory.read16(dsp);
      case addrmode.IMMEDIATE:
        return this.memory.read16(this.psw.getPC() + 2); // 命令の次のワードがオペランド
      case addrmode.FP_RELATIVE:
        return this.memory.read16(dsp);
      case addrmode.REG_TO_REG:
        return this.readReg(rx); // rxレジスタの内容がオペランド
      case addrmode.SHORT_IMMEDIATE:
        return this.extSignedInt4(rx); // rxの値がオペランド
      case addrmode.REG_INDIRECT:
        return this.memory.read16(dsp);
      case addrmode.BYTE_REG_INDIRECT:
        return this.memory.read8(dsp);
    }
    return 0;
  }

  /**
   * 命令実行
   *
   * @param inst 命令オブジェクト
   */
  private execInstruction(inst: Instruction): void {
    switch (inst.opcode) {
      case opcode.NOP:
        this.psw.nextPC();
        break;
      case opcode.LD:
        this.instrLD(inst);
        break;
      case opcode.ST:
        this.instrST(inst);
        break;
      case opcode.ADD:
      case opcode.SUB:
      case opcode.CMP:
      case opcode.AND:
      case opcode.OR:
      case opcode.XOR:
      case opcode.ADDS:
      case opcode.MUL:
      case opcode.DIV:
      case opcode.MOD:
      case opcode.SHLA:
      case opcode.SHLL:
      case opcode.SHRA:
      case opcode.SHRL:
        this.instrCalculation(inst);
        break;
      case opcode.JMP:
        this.instrJump(inst);
        break;
      case opcode.CALL:
        this.instrCall(inst);
        break;
      case opcode.IN:
        this.instrIn(inst);
        break;
      case opcode.OUT:
        this.instrOut(inst);
        break;
      case opcode.PUSH_POP:
        this.instrPushPop(inst);
        break;
      case opcode.RET_RETI:
        this.instrReturn(inst);
        break;
      case opcode.SVC:
        this.instrSvc();
        break;
      case opcode.HALT:
        this.instrHalt();
        break;
      default:
        // 未定義命令なので例外を出す
        this.intrHost.interrupt(intr.EXCP_OP_UNDEFINED);
    }
  }

  private instrLD(inst: Instruction): void {
    const data = this.loadOperand(inst.addrMode, inst.rx, inst.ea);

    this.writeReg(inst.rd, data);

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrST(inst: Instruction): void {
    // ST命令ではrdがディスティネーションではなくソースとなる
    const data = this.readReg(inst.rd);

    if (inst.addrMode === addrmode.BYTE_REG_INDIRECT) {
      // バイト・レジスタインダイレクトモードのときは, データの下位8ビットのみを書き込む
      this.memory.write8(inst.ea, 0x00ff & data);
    } else {
      this.memory.write16(inst.ea, data);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrCalculation(inst: Instruction): void {
    const v1 = this.readReg(inst.rd);
    const v2 = this.loadOperand(inst.addrMode, inst.rx, inst.ea);

    const ans = this.alu.calc(inst.opcode, v1, v2);
    this.changeFlag(inst.opcode, ans, v1, v2);

    if (inst.opcode !== opcode.CMP) {
      // CMP命令は値の代入を行わない(フラグ変化のみ)
      this.writeReg(inst.rd, ans);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrJump(inst: Instruction): void {
    const zFlag = this.psw.checkFlag(flag.ZERO);
    const cFlag = this.psw.checkFlag(flag.CARRY);
    const sFlag = this.psw.checkFlag(flag.SIGN);
    const vFlag = this.psw.checkFlag(flag.OVERFLOW);

    switch (inst.rd) {
      case opcode.JMP_JZ:
        if (zFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JC:
        if (cFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JM:
        if (sFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JO:
        if (vFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JGT:
        if (!(zFlag || (!sFlag && vFlag) || (sFlag && !vFlag))) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JGE:
        if (!((!sFlag && vFlag) || (sFlag && !vFlag))) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JLE:
        if (zFlag || (!sFlag && vFlag) || (sFlag && !vFlag)) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JLT:
        if ((!sFlag && vFlag) || (sFlag && !vFlag)) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JNZ:
        if (!zFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JNC:
        if (!cFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JNM:
        if (!sFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JNO:
        if (!vFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JHI:
        if (!(zFlag || cFlag)) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JLS:
        if (zFlag || cFlag) {
          this.psw.jumpTo(inst.ea);
          return;
        }
        break;
      case opcode.JMP_JMP:
        this.psw.jumpTo(inst.ea);
        return;
    }

    // ジャンプ命令は全て2ワード長なのでpc += 4
    this.psw.nextPC();
    this.psw.nextPC();
  }

  private instrCall(inst: Instruction): void {
    // 次の命令のアドレスをスタックに保存する
    this.pushVal(this.psw.getPC() + 4);
    this.psw.jumpTo(inst.ea);
  }

  private instrPushPop(inst: Instruction): void {
    if (inst.addrMode === 0x00) {
      // PUSH命令
      this.pushVal(this.readReg(inst.rd));
    } else if (inst.addrMode === 0x04) {
      // POP命令
      this.writeReg(inst.rd, this.popVal());
    }

    this.psw.nextPC();
  }

  private instrReturn(inst: Instruction): void {
    if (inst.addrMode === 0x00) {
      // RET命令
      this.psw.jumpTo(this.popVal());
    } else if (inst.addrMode === 0x04) {
      // RETI命令

      // 先にフラグを変化させるとスタックが切り替わる可能性があるため
      // PCとフラグは同時に取得する必要がある
      const f = this.popVal();
      const pc = this.popVal();

      this.psw.setFlags(f);
      this.psw.jumpTo(pc);
    }
  }

  private instrIn(inst: Instruction): void {
    if (this.psw.checkFlag(flag.PRIV) || this.psw.checkFlag(flag.IO_PRIV)) {
      this.writeReg(inst.rd, this.ioHost.input(inst.ea));
    } else {
      // ユーザーモードのときはIN命令は実行できない
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrOut(inst: Instruction): void {
    if (this.psw.checkFlag(flag.PRIV) || this.psw.checkFlag(flag.IO_PRIV)) {
      this.ioHost.output(inst.ea, this.readReg(inst.rd));
    } else {
      // ユーザーモードのときOUT命令は実行できない
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrSvc(): void {
    this.intrHost.interrupt(intr.EXCP_SVC);
    this.psw.nextPC();
  }

  private instrHalt(): void {
    if (this.psw.checkFlag(flag.PRIV)) {
      this.isHalt = true;
    } else {
      // 特権モード以外ではHALT命令は実行できない
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.psw.nextPC();
  }

  /**
   * 割込み発生時の処理を行う
   * 1. FLAGを一時保存する
   * 2. FLAGを割込み禁止(E=0)、特権モード(P=1)にする
   * 3. PCと元のFLAGを順にカーネルスタックにPUSHする
   * 4. PCに割込みハンドラの開始番地をロードする
   *
   * @param intrNum 割込み番号
   */
  private handleInterrupt(intrNum: number): void {
    const tmp = this.psw.getFlags();

    // 割込み禁止、特権モードの状態にする
    this.privSig.setPrivFlag(true);
    this.psw.setFlags((tmp & ~flag.ENABLE_INTR) | flag.PRIV);

    this.pushVal(this.psw.getPC());
    this.pushVal(tmp);
    this.psw.jumpTo(this.memory.read16(INTERRUPT_VECTOR + intrNum * 2));
  }

  private pushVal(val: number): void {
    // MMU有効の場合はTLBMiss例外が発生する必要があり
    // その際にはSPの値が変化してほしくないため
    // SPへの加算・減算より先にメモリアクセスを行うことでこれを防ぐ
    this.memory.write16(this.readReg(regNum.SP) - 2, val);
    this.writeReg(regNum.SP, this.readReg(regNum.SP) - 2);
  }

  private popVal(): number {
    const val = this.memory.read16(this.readReg(regNum.SP));
    this.writeReg(regNum.SP, this.readReg(regNum.SP) + 2);
    return val;
  }

  /**
   * 演算の種類と式を読み取りフラグを変化させる
   * フラグの変化はTeC7/VHDL/TaC/tac_cpu_alu.vhdを参考にした
   *
   * @param op  演算の種類を表すオペコード
   * @param ans 演算結果
   * @param v1  16bit整数
   * @param v2  16bit整数
   */
  private changeFlag(op: number, ans: number, v1: number, v2: number): void {
    const ansMsb = ans & 0x8000;
    const v1Msb = v1 & 0x8000;
    const v2Msb = v2 & 0x8000;

    let flags = this.psw.getFlags() & 0xfff0;

    if (op === opcode.ADD) {
      if (v1Msb === v2Msb && ansMsb !== v1Msb) {
        flags |= flag.OVERFLOW;
      }
    } else if (op === opcode.SUB || op === opcode.CMP) {
      if (v1Msb !== v2Msb && ansMsb !== v1Msb) {
        flags |= flag.OVERFLOW;
      }
    }

    if (opcode.ADD <= op && op <= opcode.CMP) {
      if ((ans & 0x10000) !== 0) {
        flags |= flag.CARRY;
      }
    } else if (opcode.SHLA <= op && op <= opcode.SHRL && v2 === 1) {
      // シフト命令は1ビットシフトのときだけCフラグを変化させる
      if ((ans & 0x10000) !== 0) {
        flags |= flag.CARRY;
      }
    }

    if (ansMsb !== 0) {
      flags |= flag.SIGN;
    }

    if ((ans & 0xffff) === 0) {
      flags |= flag.ZERO;
    }

    this.psw.setFlags(flags);
  }

  /**
   * 4bitの値を符号付き16bitに符号拡張する
   *
   * @param  val 4bit整数
   * @return valを符号拡張した符号付き16bit整数
   */
  private extSignedInt4(val: number): number {
    if ((val & 0x08) !== 0) {
      val |= 0xfff0;
    }
    return val;
  }

  /**
   * 2ワード命令かどうか確かめる
   *
   * @param addrMode アドレッシングモード
   * @return 2ワード命令ならTrue
   */
  private isTwoWordInstruction(addrMode: number): boolean {
    return addrmode.DIRECT <= addrMode && addrMode <= addrmode.IMMEDIATE;
  }

  /**
   * レジスタの内容を読み込む
   * numが15のときはPSWのフラグに書き込む
   *
   * @param num レジスタ番号
   * @return 指定した番号のレジスタの内容
   */
  private readReg(num: number): number {
    if (num === regNum.FLAG) {
      return this.psw.getFlags();
    }
    return this.register.read(num);
  }

  /**
   * レジスタにデータを書き込む
   * numが15のときはPSWのフラグに書き込む
   *
   * @param num レジスタ番号
   * @param val 書き込みたいデータ
   */
  private writeReg(num: number, val: number): void {
    if (num === regNum.FLAG) {
      this.psw.setFlags(val);
    } else {
      this.register.write(num, val);
    }
  }

  reset(): void {
    this.isHalt = false;
  }
}
