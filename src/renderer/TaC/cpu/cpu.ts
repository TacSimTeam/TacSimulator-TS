import { Register, REGISTER_FP, REGISTER_SP } from './register';
import { IDataBus, IIntrController } from '../interface';
import { Instruction } from './instruction/instruction';
import * as opcode from './instruction/opcode';
import * as intr from '../interrupt/interruptNum';

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
  private isException: boolean;

  private memory: IDataBus;
  private intrController: IIntrController;
  private register: Register;

  constructor(memory: IDataBus, intrController: IIntrController) {
    this.register = new Register();
    this.memory = memory;
    this.intrController = intrController;
    this.cpuFlag = FLAG_P;
    this.isHalt = false;
    this.isException = false;
    this.pc = 0;
  }

  /* 命令実行サイクル */
  run() {
    /* 割り込み判定 */
    if (this.evalFlag(FLAG_E) || this.intrController.isOccurredException()) {
      const intrNum = this.intrController.checkIntrNum();
      if (intrNum !== -1) {
        this.handleInterrupt(intrNum);
      }
    }

    /* 命令フェッチ */
    const data = this.memory.read16(this.pc); /* TLBMissの可能性あり */
    this.nextPC();

    /* 命令デコード */
    const inst = this.decode(data);

    /* 実効アドレス計算 */
    inst.dsp = this.calcEffectiveAddress(inst.addrMode, inst.rx); /* TLBMissの可能性あり */

    /* オペランド読出し */
    inst.operand = this.loadOperand(inst.addrMode, inst.rx, inst.dsp); /* TLBMissの可能性あり */

    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }

    /* 命令実行 */
    this.execInstruction(inst);
  }

  /**
   * 命令デコード
   *
   * @param data Mem[PC]から取得したデータ
   * @returns 命令オブジェクト
   */
  private decode(data: number): Instruction {
    const inst: Instruction = {
      opcode: data >>> 11,
      addrMode: (data >>> 8) & 0x07,
      rd: (data >>> 4) & 0x0f,
      rx: data & 0x0f,
      dsp: 0,
      operand: 0,
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
    const data = this.memory.read16(this.pc);
    switch (addrMode) {
      case ADDRMODE_DIRECT:
        return data;
      case ADDRMODE_INDEXED:
        return data + this.register.readReg(rx);
      case ADDRMODE_FP_RELATIVE:
        return this.register.readReg(REGISTER_FP) + this.convSignedInt4(rx) * 2;
      case ADDRMODE_REG_INDIRECT:
        return this.register.readReg(rx);
      case ADDRMODE_BYTE_REG_INDIRECT:
        return this.register.readReg(rx);
      default:
        return 0;
    }
  }

  /**
   * オペランド読み出し
   *
   * @param addrMode アドレッシングモード
   * @param rx インデクスレジスタ
   * @param dsp 実効アドレス
   * @returns 読み出した値
   */
  private loadOperand(addrMode: number, rx: number, dsp: number) {
    switch (addrMode) {
      case ADDRMODE_DIRECT:
        return this.memory.read16(dsp); /* TLBMissの可能性あり */
      case ADDRMODE_INDEXED:
        return this.memory.read16(dsp + this.register.readReg(rx)); /* TLBMissの可能性あり */
      case ADDRMODE_IMMEDIATE:
        return this.memory.read16(this.pc);
      case ADDRMODE_FP_RELATIVE:
        return this.memory.read16(dsp); /* TLBMissの可能性あり */
      case ADDRMODE_REG_TO_REG:
        return this.register.readReg(rx);
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
        console.log('IN');
        break;
      case opcode.OUT:
        console.log('OUT');
        break;
      case opcode.PUSH_POP:
        this.instrPushPop(inst);
        break;
      case opcode.RET_RETI:
        this.instrReturn(inst);
        break;
      case opcode.SVC:
        this.intrController.interrupt(intr.EXCP_SVC);
        break;
      case opcode.HALT:
        this.instrHalt();
        break;
      default:
        this.intrController.interrupt(intr.EXCP_OP_UNDEFINED);
    }
  }

  private instrLD(inst: Instruction) {
    if (inst.rd === 15) {
      this.cpuFlag = 0xff & inst.operand;
    } else {
      this.register.writeReg(inst.rd, inst.operand);
    }
  }

  private instrST(inst: Instruction) {
    /* ST命令ではrdがディスティネーションではなくソースとなる */
    const data = this.register.readReg(inst.rd);
    if (inst.addrMode == ADDRMODE_BYTE_REG_INDIRECT) {
      this.memory.write8(inst.dsp, 0x00ff & data);
    } else {
      this.memory.write16(inst.dsp, data);
    }
  }

  private instrCalculation(inst: Instruction) {
    let ans = 0;
    const rd = this.getRegister(inst.rd);
    switch (inst.opcode) {
      case opcode.ADD:
        ans = rd + inst.operand;
        break;
      case opcode.SUB:
      case opcode.CMP:
        ans = rd - inst.operand;
        break;
      case opcode.AND:
        ans = rd & inst.operand;
        break;
      case opcode.OR:
        ans = rd | inst.operand;
        break;
      case opcode.XOR:
        ans = rd ^ inst.operand;
        break;
      case opcode.ADDS:
        ans = rd + inst.operand * 2;
        break;
      case opcode.MUL:
        ans = rd * inst.operand;
        break;
      case opcode.DIV:
        if (inst.operand === 0) {
          this.intrController.interrupt(intr.EXCP_ZERO_DIV);
        } else {
          ans = rd / inst.operand;
        }
        break;
      case opcode.MOD:
        if (inst.operand === 0) {
          this.intrController.interrupt(intr.EXCP_ZERO_DIV);
        } else {
          ans = rd % inst.operand;
        }
        break;
      case opcode.SHLA:
      case opcode.SHLL:
        /* SHLA命令とSHLL命令は同じ動作 */
        ans = rd << inst.operand;
        break;
      case opcode.SHRA:
        if ((rd & 0x8000) != 0) {
          ans = (rd | ~0xffff) >> inst.operand;
        } else {
          ans = rd >> inst.operand;
        }
        break;
      case opcode.SHRL:
        ans = rd >>> inst.operand;
        break;
    }

    this.changeFlag(inst.opcode, ans, rd, inst.operand);
    ans = ans & 0xffff;
    if (inst.opcode !== opcode.CMP) {
      this.setRegister(inst.rd, ans);
    }
  }

  private instrJump(inst: Instruction) {
    const zFlag = this.evalFlag(FLAG_Z);
    const cFlag = this.evalFlag(FLAG_C);
    const sFlag = this.evalFlag(FLAG_S);
    const vFlag = this.evalFlag(FLAG_V);

    switch (inst.rd) {
      case opcode.JMP_JZ:
        if (zFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JC:
        if (cFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JM:
        if (sFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JO:
        if (vFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JGT:
        if (!(zFlag || (!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JGE:
        if (!((!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JLE:
        if (zFlag || (!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JLT:
        if ((!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JNZ:
        if (!zFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JNC:
        if (!cFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JNM:
        if (!sFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JNO:
        if (!vFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JHI:
        if (!(zFlag || cFlag)) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JLS:
        if (zFlag || cFlag) this.setPC(inst.dsp);
        break;
      case opcode.JMP_JMP:
        this.setPC(inst.dsp);
        break;
    }
  }

  private instrCall(inst: Instruction) {
    this.pushVal(this.pc);
    this.pc = inst.dsp;
  }

  private instrPushPop(inst: Instruction) {
    if (inst.addrMode === 0x00) {
      /* PUSH命令 */
      this.pushVal(this.getRegister(inst.rd));
    } else if (inst.addrMode === 0x04) {
      /* POP命令 */
      this.setRegister(inst.rd, this.popVal());
    }
  }

  private instrReturn(inst: Instruction) {
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
      this.register.setPrivMode(this.evalFlag(FLAG_P));
    }
  }

  private instrHalt() {
    if (this.evalFlag(FLAG_P)) {
      this.isHalt = true;
    } else {
      this.intrController.interrupt(intr.EXCP_PRIV_ERROR);
    }
  }

  private pushVal(val: number) {
    this.setRegister(REGISTER_SP, this.getRegister(REGISTER_SP) - 2);
    this.memory.write16(this.getRegister(REGISTER_SP), val);
  }

  private popVal() {
    const val = this.memory.read16(this.getRegister(REGISTER_SP));
    this.setRegister(REGISTER_SP, this.getRegister(REGISTER_SP) + 2);
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

    this.cpuFlag = this.cpuFlag & 0xf0;

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

    this.register.setPrivMode(true);
    this.pushVal(this.pc);
    this.pushVal(tmp);
    this.pc = this.memory.read16(INTERRUPT_VECTOR + intrNum * 2);
  }

  setRegister(num: number, val: number) {
    this.register.writeReg(num, val & 0xffff);
  }

  getRegister(num: number) {
    return this.register.readReg(num);
  }

  setPC(pc: number) {
    if (!(0x0000 <= pc && pc <= 0xffff)) {
      throw new Error('不正プログラムカウンタエラー');
    } else if ((pc & 1) !== 0) {
      throw new Error('不正プログラムカウンタエラー');
    }
    this.pc = pc;
  }

  getPC() {
    return this.pc;
  }

  getFlag() {
    return this.cpuFlag;
  }
}
