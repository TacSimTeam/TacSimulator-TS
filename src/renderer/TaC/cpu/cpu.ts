import { Register, REGISTER_FP } from './register';
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

  run() {
    // fetch
    const data = this.memory.read16(this.pc);
    this.nextPC();

    // decode
    const inst = this.decode(data);

    // effective address calculation
    inst.dsp = this.calcEffectiveAddress(inst.addrMode, inst.rx);

    // loading operand
    inst.operand = this.loadOperand(inst.addrMode, inst.rx, inst.dsp);

    if (this.isTwoWordInstruction(inst.addrMode)) {
      this.nextPC();
    }

    // execute
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

  /* valを符号付4bit整数に変換する */
  private convSignedInt4(val: number) {
    if ((val & 0x08) !== 0) {
      val = (val & 0x07) - 8;
    }
    return val;
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
        return 0;
    }
  }

  /**
   * 命令実行
   *
   * @param inst 命令オブジェクト
   */
  private execInstruction(inst: Instruction) {
    switch (inst.op) {
      case operation.NOP: // OK
        console.log('NOP');
        break;
      case operation.LD: // OK
        this.instrLD(inst);
        console.log('LD');
        break;
      case operation.ST: // OK
        this.instrST(inst);
        console.log('ST');
        break;
      case operation.ADD:
        console.log('ADD');
        break;
      case operation.SUB:
        console.log('SUB');
        break;
      case operation.CMP:
        console.log('CMP');
        break;
      case operation.AND:
        console.log('AND');
        break;
      case operation.OR:
        console.log('OR');
        break;
      case operation.XOR:
        console.log('XOR');
        break;
      case operation.ADDS:
        console.log('ADDS');
        break;
      case operation.MUL:
        console.log('MUL');
        break;
      case operation.DIV:
        console.log('DIV');
        break;
      case operation.MOD:
        console.log('MOD');
        break;
      case operation.SHLA:
        console.log('SHLA');
        break;
      case operation.SHLL:
        console.log('SHLL');
        break;
      case operation.SHRA:
        console.log('SHRA');
        break;
      case operation.SHRL:
        console.log('SHRL');
        break;
      case operation.JMP:
        console.log('JMP');
        break;
      case operation.CALL:
        console.log('CALL');
        break;
      case operation.IN:
        console.log('OUT');
        break;
      case operation.OUT:
        console.log('OUT');
        break;
      case operation.PUSH_POP:
        console.log('PUSH_POP');
        break;
      case operation.RET_RETI:
        console.log('RET_RETI');
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

  /* PCを1ワード分(2バイト)進める */
  private nextPC() {
    this.pc += 2;
  }

  /* 2ワード命令ならTrue */
  private isTwoWordInstruction(addrMode: number) {
    return addrMode === ADDRMODE_DIRECT || addrMode === ADDRMODE_INDEXED || addrMode === ADDRMODE_IMMEDIATE;
  }

  private instrLD(inst: Instruction) {
    if (inst.rd === 15) {
      this.flag = 0xff & inst.operand;
    } else {
      this.register.writeReg(inst.rd, inst.operand);
    }
  }

  private instrST(inst: Instruction) {
    const data = this.register.readReg(inst.rd);
    if (inst.addrMode == ADDRMODE_BYTE_REG_INDIRECT) {
      this.memory.write8(inst.dsp, 0x0f & data);
    } else {
      this.memory.write16(inst.dsp, data);
    }
  }

  /* テスト用関数 */
  private setRegister(num: number, val: number) {
    this.register.writeReg(num, val);
  }

  /* テスト用関数 */
  private getRegister(num: number) {
    return this.register.readReg(num);
  }

  /* テスト用関数 */
  private setPC(pc: number) {
    this.pc = pc;
  }
}
