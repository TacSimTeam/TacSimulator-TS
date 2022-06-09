import { Register, REGISTER_FP, REGISTER_SP } from './register';
import { IDataBus } from '../interface/dataBus';
import * as operation from './operation';

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // 実効アドレス
  operand: number; // オペランド
};

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

export class Cpu {
  private flag: number;
  private pc: number;
  private memory: IDataBus;

  private haltFlag: boolean;

  private register: Register;

  constructor(memory: IDataBus) {
    this.register = new Register();
    this.flag = FLAG_P;
    this.memory = memory;
    this.haltFlag = false;
    this.pc = 0;
  }

  /* 命令実行サイクル */
  run() {
    // 命令フェッチ
    const data = this.memory.read16(this.pc);
    this.nextPC();

    // 命令デコード
    const inst = this.decode(data);

    // 実効アドレス計算
    inst.dsp = this.calcEffectiveAddress(inst.addrMode, inst.rx);

    // オペランド読出し
    inst.operand = this.loadOperand(inst.addrMode, inst.rx, inst.dsp);

    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }

    // 命令実行
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
      op: data >>> 11,
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
        return this.memory.read16(dsp);
      case ADDRMODE_INDEXED:
        return this.memory.read16(dsp + this.register.readReg(rx));
      case ADDRMODE_IMMEDIATE:
        return this.memory.read16(this.pc);
      case ADDRMODE_FP_RELATIVE:
        return this.memory.read16(dsp);
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
    switch (inst.op) {
      case operation.NOP:
        break;
      case operation.LD:
        this.instrLD(inst);
        break;
      case operation.ST:
        this.instrST(inst);
        break;
      case operation.ADD:
      case operation.SUB:
      case operation.CMP:
      case operation.AND:
      case operation.OR:
      case operation.XOR:
      case operation.ADDS:
      case operation.MUL:
      case operation.DIV:
      case operation.MOD:
      case operation.SHLA:
      case operation.SHLL:
      case operation.SHRA:
      case operation.SHRL:
        this.instrCalculation(inst);
        break;
      case operation.JMP:
        this.instrJump(inst);
        break;
      case operation.CALL:
        this.instrCall(inst);
        break;
      case operation.IN:
        console.log('IN');
        break;
      case operation.OUT:
        console.log('OUT');
        break;
      case operation.PUSH_POP:
        this.instrPushPop(inst);
        break;
      case operation.RET_RETI:
        this.instrReturn(inst);
        break;
      case operation.SVC:
        console.log('SVC');
        break;
      case operation.HALT:
        this.haltFlag = true;
        console.log('HALT');
        break;
      default:
        throw new Error('未定義命令');
    }
  }

  private instrLD(inst: Instruction) {
    if (inst.rd === 15) {
      this.flag = 0xff & inst.operand;
    } else {
      this.register.writeReg(inst.rd, inst.operand);
    }
  }

  private instrST(inst: Instruction) {
    // ST命令ではrdがディスティネーションではなくソースとなる
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
    switch (inst.op) {
      case operation.ADD:
        ans = rd + inst.operand;
        break;
      case operation.SUB:
      case operation.CMP:
        ans = rd - inst.operand;
        break;
      case operation.AND:
        ans = rd & inst.operand;
        break;
      case operation.OR:
        ans = rd | inst.operand;
        break;
      case operation.XOR:
        ans = rd ^ inst.operand;
        break;
      case operation.ADDS:
        ans = rd + inst.operand * 2;
        break;
      case operation.MUL:
        ans = rd * inst.operand;
        break;
      case operation.DIV:
        if (inst.operand === 0) {
          console.log('ゼロ除算');
        } else {
          ans = rd / inst.operand;
        }
        break;
      case operation.MOD:
        if (inst.operand === 0) {
          console.log('ゼロ除算');
        } else {
          ans = rd % inst.operand;
        }
        break;
      case operation.SHLA:
      case operation.SHLL:
        // SHLA命令とSHLL命令は同じ動作
        ans = rd << inst.operand;
        break;
      case operation.SHRA:
        if ((rd & 0x8000) != 0) {
          ans = (rd | ~0xffff) >> inst.operand;
        } else {
          ans = rd >> inst.operand;
        }
        break;
      case operation.SHRL:
        ans = rd >>> inst.operand;
        break;
    }

    this.changeFlag(inst.op, ans, rd, inst.operand);
    ans = ans & 0xffff;
    if (inst.op !== operation.CMP) {
      this.setRegister(inst.rd, ans);
    }
  }

  private instrJump(inst: Instruction) {
    const zFlag = this.evalFlag(FLAG_Z);
    const cFlag = this.evalFlag(FLAG_C);
    const sFlag = this.evalFlag(FLAG_S);
    const vFlag = this.evalFlag(FLAG_V);

    switch (inst.rd) {
      case operation.JMP_JZ:
        if (zFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JC:
        if (cFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JM:
        if (sFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JO:
        if (vFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JGT:
        if (!(zFlag || (!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.dsp);
        break;
      case operation.JMP_JGE:
        if (!((!sFlag && vFlag) || (sFlag && !vFlag))) this.setPC(inst.dsp);
        break;
      case operation.JMP_JLE:
        if (zFlag || (!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.dsp);
        break;
      case operation.JMP_JLT:
        if ((!sFlag && vFlag) || (sFlag && !vFlag)) this.setPC(inst.dsp);
        break;
      case operation.JMP_JNZ:
        if (!zFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JNC:
        if (!cFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JNM:
        if (!sFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JNO:
        if (!vFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JHI:
        if (!(zFlag || cFlag)) this.setPC(inst.dsp);
        break;
      case operation.JMP_JLS:
        if (zFlag || cFlag) this.setPC(inst.dsp);
        break;
      case operation.JMP_JMP:
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
      this.pushVal(this.getRegister(inst.rd));
    } else if (inst.addrMode === 0x04) {
      this.setRegister(inst.rd, this.popVal());
    }
  }

  private instrReturn(inst: Instruction) {
    if (inst.addrMode === 0x00) {
      this.pc = this.popVal();
    } else if (inst.addrMode === 0x04) {
      if (this.evalFlag(FLAG_P)) {
        // 特権モード
        this.flag = this.popVal();
      } else {
        // I/O特権モード or ユーザモード
        this.flag = (0xf0 & this.flag) | (0x0f & this.popVal());
      }
      this.pc = this.popVal();
      this.register.setPrivMode(this.evalFlag(FLAG_P));
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
    return (this.flag & f) !== 0;
  }

  /* 演算の種類と式を読み取りフラグを変化させる */
  private changeFlag(op: number, ans: number, v1: number, v2: number) {
    const ansMsb = ans & 0x8000;
    const v1Msb = v1 & 0x8000;
    const v2Msb = v2 & 0x8000;

    this.flag = this.flag & 0xf0;

    // TeC7/VHDL/TaC/tac_cpu_alu.vhdを参考にした
    if (op === operation.ADD) {
      if (v1Msb === v2Msb && ansMsb !== v1Msb) {
        this.flag |= FLAG_V;
      }
    } else if (op === operation.SUB || op === operation.CMP) {
      if (v1Msb !== v2Msb && ansMsb !== v1Msb) {
        this.flag |= FLAG_V;
      }
    }

    if (operation.ADD <= op && op <= operation.CMP) {
      if ((ans & 0x10000) !== 0) {
        this.flag |= FLAG_C;
      }
    } else if (operation.SHLA <= op && op <= operation.SHRL && v2 === 1) {
      // シフト命令は1ビットシフトのときだけCフラグを変化させる
      if ((ans & 0x10000) !== 0) {
        this.flag |= FLAG_C;
      }
    }

    if (ansMsb !== 0) {
      this.flag |= FLAG_S;
    }

    if ((ans & 0xffff) == 0) {
      this.flag |= FLAG_Z;
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
    return this.flag;
  }
}
