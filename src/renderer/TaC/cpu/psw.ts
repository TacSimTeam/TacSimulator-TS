import { IPrivModeSignal } from '../interface';
import { IPsw } from '../interface/cpu/psw';

const FLAG_P = 0x40;

export class Psw implements IPsw {
  private pc: number;
  private flags: number;
  private privSig: IPrivModeSignal;

  constructor(privSig: IPrivModeSignal) {
    this.pc = 0xe000;
    this.flags = FLAG_P;
    this.privSig = privSig;
    this.privSig.setPrivMode(true);
  }

  nextPC() {
    this.pc += 2;
  }

  getPC(): number {
    return this.pc;
  }

  jumpTo(pc: number) {
    this.pc = pc;
  }

  getFlags(): number {
    return this.flags;
  }

  setFlags(flags: number): void {
    this.flags = flags;
    this.privSig.setPrivMode(this.evalFlag(FLAG_P));
  }

  evalFlag(flag: number): boolean {
    return (this.flags & flag) !== 0;
  }

  reset(): void {
    this.pc = 0xe000;
    this.flags = FLAG_P;
    this.privSig.setPrivMode(true);
  }
}
