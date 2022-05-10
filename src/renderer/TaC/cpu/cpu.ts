import { Register } from './register';
import { FLAG_E, FLAG_P, FLAG_I, FLAG_V, FLAG_C, FLAG_S, FLAG_Z } from './flag';

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // オペランド
};

export class Cpu {
  private flag: number;
  private pc: number;

  private register: Register;

  constructor() {
    this.register = new Register();
    this.flag = FLAG_P;
    this.pc = 0;
  }

  exec(val: number) {
    this.execInstruction(this.convInstruction(val));
  }

  private convInstruction(val: number): Instruction {
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
    console.log('命令実行');
  }
}
