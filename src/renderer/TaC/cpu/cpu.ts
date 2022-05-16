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

  private register: Register;

  constructor(memory: IDataBus) {
    this.register = new Register();
    this.flag = FLAG_P;
    this.memory = memory;
    this.pc = 0;
  }

  run() {
    for (;;) {
      // fetch
      const data = this.memory.read16(this.pc);
      this.nextPC();

      // decode
      const inst = this.decode(data);

      // effective address calculation
      inst.dsp = this.calcEffectiveAddress(inst.addrMode, inst.rx);
    }
  }

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
        // console.log(`rx : ${rx}, this.convSignedInt4(rx) : ${this.convSignedInt4(rx)}`);
        return this.register.readReg(REGISTER_FP) + this.convSignedInt4(rx) * 2;
      default:
        return 0;
    }
  }

  private execInstruction(inst: Instruction) {
    switch (inst.op) {
      case operation.NOP:
        console.log('NOP');
        break;
    }
  }

  private nextPC() {
    this.pc += 2;
  }

  /* テスト用関数 */
  private setRegister(num: number, val: number) {
    this.register.writeReg(num, val);
  }

  /* テスト用関数 */
  private setPC(pc: number) {
    this.pc = pc;
  }
}
