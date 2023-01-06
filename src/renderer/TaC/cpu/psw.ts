import { IPrivModeSignal, IPsw } from '../interface';
import { PRIV } from './const/flag';

export class Psw implements IPsw, IPrivModeSignal {
  private pc: number;
  private flags: number;

  constructor() {
    this.pc = 0xe000;
    this.flags = PRIV;
  }

  nextPC(): void {
    if (this.pc >= 0xfffe) {
      console.warn('このnextPC()呼び出しによって、PCの値が0xffffを超えてしまいます');
    }
    this.pc += 2;
  }

  getPC(): number {
    return this.pc;
  }

  jumpTo(addr: number): void {
    if (!(0x0000 <= addr && addr <= 0xffff)) {
      console.warn('TaCのメモリの範囲外にジャンプしようとしています');
    } else if ((addr & 0x0001) !== 0) {
      console.warn('奇数番地にジャンプしようとしています');
    }
    this.pc = addr;
  }

  getFlags(): number {
    return this.flags;
  }

  setFlags(flags: number): void {
    if (this.checkFlag(PRIV)) {
      this.flags = flags;
      return;
    }

    // I/O特権モードかユーザモードのときは、EPIフラグ(0x00e0の箇所)を変化させない
    this.flags = (0x00e0 & this.flags) | (0xff1f & flags);
  }

  checkFlag(flag: number): boolean {
    return (this.flags & flag) !== 0;
  }

  getPrivFlag(): boolean {
    return this.checkFlag(PRIV);
  }

  setPrivFlag(flag: boolean): void {
    if (flag) {
      this.flags = this.flags | PRIV;
    } else {
      this.flags = this.flags & (~PRIV & 0xffff);
    }
  }

  reset(): void {
    this.pc = 0xe000;
    this.flags = PRIV;
  }
}
