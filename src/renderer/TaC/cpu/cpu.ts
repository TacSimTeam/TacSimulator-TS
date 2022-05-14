import { Register } from './register';
import { IDataBus } from '../interface/dataBus';
import * as operation from './operation';

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // オペランド
};

const FLAG_E = 0x80;
const FLAG_P = 0x40;
const FLAG_I = 0x20;
const FLAG_V = 0x08;
const FLAG_C = 0x04;
const FLAG_S = 0x02;
const FLAG_Z = 0x01;

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

  exec(val: number) {
    this.execInstruction(this.decode(val));
  }

  getPC() {
    const nextPC = this.pc;
    this.pc += 1;
    return nextPC;
  }

  private decode(val: number): Instruction {
    const inst: Instruction = {
      op: 0,
      addrMode: 0,
      rd: 0,
      rx: 0,
      dsp: 0,
    };

    return inst;
  }

  private execInstruction(inst: Instruction) {
    switch (inst.op) {
      case operation.NOP:
        console.log('NOP');
        break;
    }
  }
}
