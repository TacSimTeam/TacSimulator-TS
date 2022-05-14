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

  run() {
    for (;;) {
      // fetch
      const data = this.memory.read16(this.pc);

      // decode
      const inst = this.decode(data);
    }
  }

  private decode(data: number): Instruction {
    const inst: Instruction = {
      op: data >>> 11,
      addrMode: (data >>> 8) & 0x07,
      rd: (data >>> 4) & 0x0f,
      rx: data & 0x0f,
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
