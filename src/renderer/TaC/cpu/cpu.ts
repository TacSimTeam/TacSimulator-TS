import { REGISTER_FLAG, REGISTER_FP, REGISTER_SP } from './register';
import { IDataBus, IIntrController, IPrivModeSignal, IIOHostController } from '../interface';
import { Instruction } from './instruction/instruction';
import * as opcode from './instruction/opcode';
import * as intr from '../interrupt/interruptNum';
import { TlbMissError } from '../error';
import { opcodeToString, regNumToString } from '../debug/instruction';
import { IRegister } from '../interface/register';

const FLAG_E = 0x80;
const FLAG_P = 0x40;
const FLAG_I = 0x20;
const FLAG_V = 0x08;
const FLAG_C = 0x04;
const FLAG_S = 0x02;
const FLAG_Z = 0x01;

const ADDRMODE_DIRECT = 0;
const ADDRMODE_INDEXED = 1;
const ADDRMODE_IMMEDIATE = 2;
const ADDRMODE_FP_RELATIVE = 3;
const ADDRMODE_REG_TO_REG = 4;
const ADDRMODE_SHORT_IMMEDIATE = 5;
const ADDRMODE_REG_INDIRECT = 6;
const ADDRMODE_BYTE_REG_INDIRECT = 7;

const INTERRUPT_VECTOR = 0xffe0;

export class Cpu {
  private cpuFlag: number;
  private pc: number;

  private isHalt: boolean;

  private memory: IDataBus;
  private intrHost: IIntrController;
  private register: IRegister;
  private ioHost: IIOHostController;
  private privSig: IPrivModeSignal;

  constructor(
    register: IRegister,
    memory: IDataBus,
    intrHost: IIntrController,
    ioHost: IIOHostController,
    privSig: IPrivModeSignal
  ) {
    this.memory = memory;
    this.register = register;

    this.intrHost = intrHost;
    this.ioHost = ioHost;
    this.privSig = privSig;

    this.cpuFlag = FLAG_P;
    this.isHalt = false;
    this.pc = 0;

    this.cnt = 0;
  }

  /* 命令実行サイクル */
  run() {
    if (this.isHalt) {
      return;
    }

    /* 特権フラグの確認用信号の更新 */
    this.privSig.setPrivMode(this.evalFlag(FLAG_P));

    /* 割り込み判定 */
    if (this.evalFlag(FLAG_E) || this.intrHost.isOccurredException()) {
      const intrNum = this.intrHost.checkIntrNum();
      if (intrNum !== -1) {
        console.log(`interrupt : ${intrNum}`);
        this.handleInterrupt(intrNum);
      }
    }

    /* 命令フェッチ(TLBミスが発生する可能性有り) */
    let data = 0;
    try {
      data = this.memory.read16(this.pc);
    } catch (e) {
      if (e instanceof TlbMissError) {
        /* TLBMissが発生したのでPCを進めずに一旦戻す */
        return;
      }
    }

    /* 命令デコード */
    const inst = this.decode(data);

    /* 実効アドレス計算 */
    inst.ea = this.calcEffectiveAddress(inst.addrMode, inst.rx);

    /* 命令実行(TLBミスが発生する可能性有り) */
    try {
      this.execInstruction(inst);
    } catch (e) {
      if (e instanceof TlbMissError) {
        return;
      }
    }
  }

  /**
   * 命令デコード
   *
   * @param data Mem[PC]から取得したデータ
   * @returns 命令オブジェクト
   */
  private decode(data: number) {
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
   *
   * @param addrMode アドレッシングモード
   * @param rx インデクスレジスタ
   * @returns 対象となるアドレス. 1ワード命令の時は0を返す
   */
  private calcEffectiveAddress(addrMode: number, rx: number) {
    const data = this.memory.read16(this.pc + 2);
    switch (addrMode) {
      case ADDRMODE_DIRECT:
        return data;
      case ADDRMODE_INDEXED:
        return data + this.readReg(rx);
      case ADDRMODE_FP_RELATIVE:
        return this.readReg(REGISTER_FP) + this.convSignedInt4(rx) * 2;
      case ADDRMODE_REG_INDIRECT:
      case ADDRMODE_BYTE_REG_INDIRECT:
        return this.readReg(rx);
      default:
        return 0;
    }
  }

  /**
   * オペランド読み出し
   * TLB Missの可能性アリ
   *
   * @param addrMode アドレッシングモード
   * @param rx インデクスレジスタ
   * @param dsp 実効アドレス
   * @returns 読み出した値
   */
  private loadOperand(addrMode: number, rx: number, dsp: number) {
    switch (addrMode) {
      case ADDRMODE_DIRECT:
        return this.memory.read16(dsp);
      case ADDRMODE_INDEXED:
        return this.memory.read16(dsp);
      case ADDRMODE_IMMEDIATE:
        return this.memory.read16(this.pc + 2);
      case ADDRMODE_FP_RELATIVE:
        return this.memory.read16(dsp);
      case ADDRMODE_REG_TO_REG:
        return this.readReg(rx);
      case ADDRMODE_SHORT_IMMEDIATE:
        return this.convSignedInt4(rx);
      case ADDRMODE_REG_INDIRECT:
        return this.memory.read16(dsp);
      case ADDRMODE_BYTE_REG_INDIRECT:
        return this.memory.read8(dsp);
      default:
        throw new Error('不正なアドレッシングモードエラー');
    }
  }

  /**
   * 命令実行
   *
   * @param inst 命令オブジェクト
   */
  private execInstruction(inst: Instruction) {
    switch (inst.opcode) {
      case opcode.NOP:
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
        this.debugPrint(inst);
        this.intrHost.interrupt(intr.EXCP_SVC);
        this.pc += 2;
        break;
      case opcode.HALT:
        this.debugPrint(inst);
        this.instrHalt();
        break;
      default:
        this.intrHost.interrupt(intr.EXCP_OP_UNDEFINED);
    }
  }

  private instrLD(inst: Instruction) {
    const data = this.loadOperand(inst.addrMode, inst.rx, inst.ea);
    this.debugPrint(inst);

    this.writeReg(inst.rd, data);

    this.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }
  }

  private instrST(inst: Instruction) {
    /* ST命令ではrdがディスティネーションではなくソースとなる */
    const data = this.readReg(inst.rd);
    this.debugPrint(inst);

    if (inst.addrMode == ADDRMODE_BYTE_REG_INDIRECT) {
      this.memory.write8(inst.ea, 0x00ff & data);
    } else {
      this.memory.write16(inst.ea, data);
    }

    this.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }
  }

  private instrCalculation(inst: Instruction) {
    let ans = 0;

    const v1 = this.readReg(inst.rd);
    const v2 = this.loadOperand(inst.addrMode, inst.rx, inst.ea);

    this.debugPrint(inst);

    switch (inst.opcode) {
      case opcode.ADD:
        ans = v1 + v2;
        break;
      case opcode.SUB:
      case opcode.CMP:
        ans = v1 - v2;
        break;
      case opcode.AND:
        ans = v1 & v2;
        break;
      case opcode.OR:
        ans = v1 | v2;
        break;
      case opcode.XOR:
        ans = v1 ^ v2;
        break;
      case opcode.ADDS:
        ans = v1 + v2 * 2;
        break;
      case opcode.MUL:
        ans = v1 * v2;
        break;
      case opcode.DIV:
        if (v2 === 0) {
          this.intrHost.interrupt(intr.EXCP_ZERO_DIV);
        } else {
          ans = v1 / v2;
        }
        break;
      case opcode.MOD:
        if (v2 === 0) {
          this.intrHost.interrupt(intr.EXCP_ZERO_DIV);
        } else {
          ans = v1 % v2;
        }
        break;
      case opcode.SHLA:
      case opcode.SHLL:
        /* SHLA命令とSHLL命令は同じ動作 */
        // シフト命令をImm4モードで実行したとき, rxは符号なし4bit整数として扱う...
        // 正しい仕様かどうかは不明
        ans = v1 << inst.rx;
        break;
      case opcode.SHRA:
        if ((v1 & 0x8000) != 0) {
          ans = (v1 | ~0xffff) >> v2;
        } else {
          ans = v1 >> v2;
        }
        break;
      case opcode.SHRL:
        ans = v1 >>> v2;
        break;
    }

    this.changeFlag(inst.opcode, ans, v1, v2);

    if (inst.opcode !== opcode.CMP) {
      this.writeReg(inst.rd, ans & 0xffff);
    }

    this.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }
  }

  private instrJump(inst: Instruction) {
    const zFlag = this.evalFlag(FLAG_Z);
    const cFlag = this.evalFlag(FLAG_C);
    const sFlag = this.evalFlag(FLAG_S);
    const vFlag = this.evalFlag(FLAG_V);

    this.debugPrint(inst);

    switch (inst.rd) {
      case opcode.JMP_JZ:
        if (zFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JC:
        if (cFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JM:
        if (sFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JO:
        if (vFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JGT:
        if (!(zFlag || (!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JGE:
        if (!((!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JLE:
        if (zFlag || (!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JLT:
        if ((!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JNZ:
        if (!zFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JNC:
        if (!cFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JNM:
        if (!sFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JNO:
        if (!vFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JHI:
        if (!(zFlag || cFlag)) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JLS:
        if (zFlag || cFlag) this.setPC(inst.ea);
        else this.pc += 4;
        break;
      case opcode.JMP_JMP:
        this.setPC(inst.ea);
        break;
    }
  }

  private instrCall(inst: Instruction) {
    this.debugPrint(inst);

    this.pushVal(this.pc + 4);
    this.pc = inst.ea;
  }

  private instrPushPop(inst: Instruction) {
    this.debugPrint(inst);

    if (inst.addrMode === 0x00) {
      /* PUSH命令 */
      this.pushVal(this.readReg(inst.rd));
    } else if (inst.addrMode === 0x04) {
      /* POP命令 */
      this.writeReg(inst.rd, this.popVal());
    }

    this.nextPC();
  }

  private instrReturn(inst: Instruction) {
    this.debugPrint(inst);

    if (inst.addrMode === 0x00) {
      /* RET命令 */
      this.pc = this.popVal();
    } else if (inst.addrMode === 0x04) {
      /* RETI命令*/
      if (this.evalFlag(FLAG_P)) {
        this.cpuFlag = this.popVal();
      } else {
        /* I/O特権モードかユーザモードのときは、EPIフラグは変化させない */
        this.cpuFlag = (0xf0 & this.cpuFlag) | (0x0f & this.popVal());
      }
      this.pc = this.popVal();
    }
  }

  private instrIn(inst: Instruction) {
    this.debugPrint(inst);

    if (this.evalFlag(FLAG_P) || this.evalFlag(FLAG_I)) {
      this.writeReg(inst.rd, this.ioHost.input(inst.ea));
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }
  }

  private instrOut(inst: Instruction) {
    this.debugPrint(inst);

    if (this.evalFlag(FLAG_P) || this.evalFlag(FLAG_I)) {
      this.ioHost.output(inst.ea, this.readReg(inst.rd));
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }
  }

  private instrHalt() {
    if (this.evalFlag(FLAG_P)) {
      this.isHalt = true;
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }
  }

  private pushVal(val: number) {
    this.writeReg(REGISTER_SP, this.readReg(REGISTER_SP) - 2);
    this.memory.write16(this.readReg(REGISTER_SP), val);
  }

  private popVal() {
    const val = this.memory.read16(this.readReg(REGISTER_SP));
    this.writeReg(REGISTER_SP, this.readReg(REGISTER_SP) + 2);
    return val;
  }

  /* 引数に指定したフラグが立っているかを確認する */
  private evalFlag(f: number) {
    return (this.cpuFlag & f) !== 0;
  }

  /* 演算の種類と式を読み取りフラグを変化させる */
  private changeFlag(op: number, ans: number, v1: number, v2: number) {
    /* TeC7/VHDL/TaC/tac_cpu_alu.vhdを参考にした */
    const ansMsb = ans & 0x8000;
    const v1Msb = v1 & 0x8000;
    const v2Msb = v2 & 0x8000;

    this.cpuFlag = this.cpuFlag & 0xfff0;

    if (op === opcode.ADD) {
      if (v1Msb === v2Msb && ansMsb !== v1Msb) {
        this.cpuFlag |= FLAG_V;
      }
    } else if (op === opcode.SUB || op === opcode.CMP) {
      if (v1Msb !== v2Msb && ansMsb !== v1Msb) {
        this.cpuFlag |= FLAG_V;
      }
    }

    if (opcode.ADD <= op && op <= opcode.CMP) {
      if ((ans & 0x10000) !== 0) {
        this.cpuFlag |= FLAG_C;
      }
    } else if (opcode.SHLA <= op && op <= opcode.SHRL && v2 === 1) {
      /* シフト命令は1ビットシフトのときだけCフラグを変化させる */
      if ((ans & 0x10000) !== 0) {
        this.cpuFlag |= FLAG_C;
      }
    }

    if (ansMsb !== 0) {
      this.cpuFlag |= FLAG_S;
    }

    if ((ans & 0xffff) == 0) {
      this.cpuFlag |= FLAG_Z;
    }
  }

  /* PCを1ワード分(2バイト)進める */
  private nextPC() {
    this.pc += 2;
  }

  /* valを符号付4bit整数に変換する */
  private convSignedInt4(val: number) {
    if ((val & 0x08) !== 0) {
      val = (val & 0x07) - 8;
    }
    return val;
  }

  /* 2ワード命令ならTrue */
  private isTwoWordInstruction(addrMode: number) {
    return ADDRMODE_DIRECT <= addrMode && addrMode <= ADDRMODE_IMMEDIATE;
  }

  private handleInterrupt(intrNum: number): void {
    const tmp = this.cpuFlag;

    /* 割込み禁止、特権モードの状態にする */
    this.cpuFlag = (this.cpuFlag & ~FLAG_E) | FLAG_P;

    this.pushVal(this.pc);
    this.pushVal(tmp);
    this.pc = this.memory.read16(INTERRUPT_VECTOR + intrNum * 2);
  }

  writeReg(num: number, val: number) {
    if (num == REGISTER_FLAG) {
      if (this.privSig.getPrivMode()) {
        this.cpuFlag = (0xff00 & this.cpuFlag) | (0x00ff & val);
      } else {
        /* I/O特権モードかユーザモードのときは、EPIフラグは変化させない */
        this.cpuFlag = (0xffe0 & this.cpuFlag) | (0x001f & val);
      }
    } else {
      this.register.write(num, val);
    }
  }

  readReg(num: number) {
    if (num == REGISTER_FLAG) {
      return this.cpuFlag;
    }
    return this.register.read(num);
  }

  setPC(pc: number) {
    this.pc = pc;
  }

  getPC() {
    return this.pc;
  }

  getFlag() {
    return this.cpuFlag;
  }

  private cnt: number;

  private debugPrint(inst: Instruction) {
    this.cnt++;
    console.log(
      `${this.cnt} : 0x${this.pc.toString(16)} ${opcodeToString(inst.opcode, inst.addrMode, inst.rd)} ${regNumToString(
        inst.rd
      )}, 0x${inst.ea.toString(16)} (addrMode : ${inst.addrMode})`
    );
  }

  reset() {
    this.cpuFlag = FLAG_P;
    this.isHalt = false;
    this.pc = 0;

    this.cnt = 0;
  }
}
