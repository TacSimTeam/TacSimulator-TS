import { IDataBus, IIntrController, IIOHostController, IRegister, IPsw } from '../interface';
import { Instruction } from './instruction/instruction';
import * as opcode from './const/opcode';
import * as addrmode from './const/addrmode';
import * as regNum from './const/regNum';
import * as flag from './const/flag';
import * as intr from '../interrupt/interruptNum';
import { TlbMissError } from '../error';
import { opcodeToString, regNumToString } from '../debug/instruction';
import { Alu } from './alu';

const INTERRUPT_VECTOR = 0xffe0;

export class Cpu {
  private isHalt: boolean;

  private memory: IDataBus;
  private psw: IPsw;
  private register: IRegister;
  private alu: Alu;
  private intrHost: IIntrController;
  private ioHost: IIOHostController;

  constructor(memory: IDataBus, psw: IPsw, register: IRegister, intrHost: IIntrController, ioHost: IIOHostController) {
    this.memory = memory;
    this.psw = psw;
    this.register = register;
    this.alu = new Alu(intrHost);

    this.intrHost = intrHost;
    this.ioHost = ioHost;

    this.isHalt = false;

    this.cnt = 0;
  }

  /* 命令実行サイクル */
  run() {
    if (this.isHalt) {
      return;
    }

    /* 割り込み判定 */
    if (this.psw.evalFlag(flag.ENABLE_INTR) || this.intrHost.isExceptionOccurred()) {
      const intrNum = this.intrHost.checkIntrNum();
      if (intrNum !== null) {
        this.handleInterrupt(intrNum);
      }
    }

    /* 命令フェッチ(TLBミスが発生する可能性有り) */
    let data = 0;
    try {
      data = this.memory.fetch(this.psw.getPC());
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
    const data = this.memory.read16(this.psw.getPC() + 2);
    switch (addrMode) {
      case addrmode.DIRECT:
        return data;
      case addrmode.INDEXED:
        return data + this.readReg(rx);
      case addrmode.FP_RELATIVE:
        return (this.readReg(regNum.FP) + this.extSignedInt4(rx) * 2) & 0xffff;
      case addrmode.REG_INDIRECT:
      case addrmode.BYTE_REG_INDIRECT:
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
      case addrmode.DIRECT:
        return this.memory.read16(dsp);
      case addrmode.INDEXED:
        return this.memory.read16(dsp);
      case addrmode.IMMEDIATE:
        return this.memory.read16(this.psw.getPC() + 2);
      case addrmode.FP_RELATIVE:
        return this.memory.read16(dsp);
      case addrmode.REG_TO_REG:
        return this.readReg(rx);
      case addrmode.SHORT_IMMEDIATE:
        return this.extSignedInt4(rx);
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
  private execInstruction(inst: Instruction) {
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
        this.intrHost.interrupt(intr.EXCP_SVC);
        this.psw.nextPC();
        break;
      case opcode.HALT:
        this.instrHalt();
        this.psw.nextPC();
        break;
      default:
        this.intrHost.interrupt(intr.EXCP_OP_UNDEFINED);
    }
  }

  private instrLD(inst: Instruction) {
    const data = this.loadOperand(inst.addrMode, inst.rx, inst.ea);

    this.writeReg(inst.rd, data);

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrST(inst: Instruction) {
    /* ST命令ではrdがディスティネーションではなくソースとなる */
    const data = this.readReg(inst.rd);

    if (inst.addrMode == addrmode.BYTE_REG_INDIRECT) {
      this.memory.write8(inst.ea, 0x00ff & data);
    } else {
      this.memory.write16(inst.ea, data);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrCalculation(inst: Instruction) {
    const v1 = this.readReg(inst.rd);
    const v2 = this.loadOperand(inst.addrMode, inst.rx, inst.ea);

    const ans = this.alu.calc(inst.opcode, v1, v2);
    this.changeFlag(inst.opcode, ans, v1, v2);

    if (inst.opcode !== opcode.CMP) {
      this.writeReg(inst.rd, ans);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrJump(inst: Instruction) {
    const zFlag = this.psw.evalFlag(flag.ZERO);
    const cFlag = this.psw.evalFlag(flag.CARRY);
    const sFlag = this.psw.evalFlag(flag.SIGN);
    const vFlag = this.psw.evalFlag(flag.OVERFLOW);

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

    /* ジャンプ命令は全て2ワード長なのでpc += 4 */
    this.psw.nextPC();
    this.psw.nextPC();
  }

  private instrCall(inst: Instruction) {
    this.pushVal(this.psw.getPC() + 4);
    this.psw.jumpTo(inst.ea);
  }

  private instrPushPop(inst: Instruction) {
    if (inst.addrMode === 0x00) {
      /* PUSH命令 */
      this.pushVal(this.readReg(inst.rd));
    } else if (inst.addrMode === 0x04) {
      /* POP命令 */
      this.writeReg(inst.rd, this.popVal());
    }

    this.psw.nextPC();
  }

  private instrReturn(inst: Instruction) {
    if (inst.addrMode === 0x00) {
      /* RET命令 */
      this.psw.jumpTo(this.popVal());
    } else if (inst.addrMode === 0x04) {
      /* RETI命令 */
      /**
       * 先にフラグを変化させるとスタックが切り替わる可能性があるため
       * PCとフラグは同時に取得する必要がある
       */
      const f = this.popVal();
      const pc = this.popVal();

      if (this.psw.evalFlag(flag.PRIV)) {
        this.psw.setFlags(f);
      } else {
        /* I/O特権モードかユーザモードのときは、EPIフラグは変化させない */
        this.psw.setFlags((0xf0 & this.psw.getFlags()) | (0x0f & f));
      }
      this.psw.jumpTo(pc);
    }
  }

  private instrIn(inst: Instruction) {
    if (this.psw.evalFlag(flag.PRIV) || this.psw.evalFlag(flag.IO_PRIV)) {
      this.writeReg(inst.rd, this.ioHost.input(inst.ea));
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrOut(inst: Instruction) {
    if (this.psw.evalFlag(flag.PRIV) || this.psw.evalFlag(flag.IO_PRIV)) {
      this.ioHost.output(inst.ea, this.readReg(inst.rd));
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }

    this.psw.nextPC();
    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.psw.nextPC();
    }
  }

  private instrHalt() {
    if (this.psw.evalFlag(flag.PRIV)) {
      this.isHalt = true;
    } else {
      this.intrHost.interrupt(intr.EXCP_PRIV_ERROR);
    }
  }

  private pushVal(val: number) {
    /**
     * MMU有効の場合はTLBMiss例外が発生する必要があり
     * その際にはSPの値が変化してほしくないため
     * SPへの加算・減算より先にメモリアクセスを行うことでこれを防ぐ
     */
    this.memory.write16(this.readReg(regNum.SP) - 2, val);
    this.writeReg(regNum.SP, this.readReg(regNum.SP) - 2);
  }

  private popVal() {
    const val = this.memory.read16(this.readReg(regNum.SP));
    this.writeReg(regNum.SP, this.readReg(regNum.SP) + 2);
    return val;
  }

  /* 演算の種類と式を読み取りフラグを変化させる */
  private changeFlag(op: number, ans: number, v1: number, v2: number) {
    /* TeC7/VHDL/TaC/tac_cpu_alu.vhdを参考にした */
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
      /* シフト命令は1ビットシフトのときだけCフラグを変化させる */
      if ((ans & 0x10000) !== 0) {
        flags |= flag.CARRY;
      }
    }

    if (ansMsb !== 0) {
      flags |= flag.SIGN;
    }

    if ((ans & 0xffff) == 0) {
      flags |= flag.ZERO;
    }

    this.psw.setFlags(flags);
  }

  /* 4bitの値を符号付き16bitに符号拡張する */
  private extSignedInt4(val: number) {
    if ((val & 0x08) !== 0) {
      val |= 0xfff0;
    }
    return val;
  }

  /* 2ワード命令ならTrue */
  private isTwoWordInstruction(addrMode: number) {
    return addrmode.DIRECT <= addrMode && addrMode <= addrmode.IMMEDIATE;
  }

  private handleInterrupt(intrNum: number): void {
    const tmp = this.psw.getFlags();

    /* 割込み禁止、特権モードの状態にする */
    this.psw.setFlags((tmp & ~flag.ENABLE_INTR) | flag.PRIV);

    this.pushVal(this.psw.getPC());
    this.pushVal(tmp);
    this.psw.jumpTo(this.memory.read16(INTERRUPT_VECTOR + intrNum * 2));
  }

  writeReg(num: number, val: number) {
    if (num == regNum.FLAG) {
      if (this.psw.evalFlag(flag.PRIV)) {
        this.psw.setFlags((0xff00 & this.psw.getFlags()) | (0x00ff & val));
      } else {
        /* I/O特権モードかユーザモードのときは、EPIフラグは変化させない */
        this.psw.setFlags((0xffe0 & this.psw.getFlags()) | (0x001f & val));
      }
    } else {
      this.register.write(num, val);
    }
  }

  readReg(num: number) {
    if (num == regNum.FLAG) {
      return this.psw.getFlags();
    }
    return this.register.read(num);
  }

  private cnt: number;

  private debugPrint(inst: Instruction) {
    this.cnt++;
    console.log(
      `${this.cnt} : 0x${this.psw.getPC().toString(16)} ${opcodeToString(
        inst.opcode,
        inst.addrMode,
        inst.rd
      )} ${regNumToString(inst.rd)}, 0x${inst.ea.toString(16)} (addrMode : ${inst.addrMode})`
    );
  }

  reset() {
    this.isHalt = false;
    this.cnt = 0;
  }
}
