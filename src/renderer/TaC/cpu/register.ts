import { IPrivModeSignal, IRegister } from '../interface';

export class Register implements IRegister {
  private generals: Uint16Array;
  private fp: number;
  private ssp: number;
  private usp: number;

  private privSig: IPrivModeSignal;

  constructor(privSig: IPrivModeSignal) {
    this.generals = new Uint16Array(12);
    this.fp = 0;
    this.ssp = 0;
    this.usp = 0;
    this.privSig = privSig;

    this.reset();
  }

  read(num: number): number {
    switch (num) {
      case 12:
        return this.fp;
      case 13:
        if (this.privSig.getPrivFlag()) {
          return this.ssp;
        } else {
          return this.usp;
        }
      case 14:
        return this.usp;
      default:
        return this.generals[num];
    }
  }

  write(num: number, val: number): void {
    switch (num) {
      case 12:
        this.fp = val & 0xffff;
        break;
      case 13:
        if (this.privSig.getPrivFlag()) {
          this.ssp = val & 0xffff;
        } else {
          this.usp = val & 0xffff;
        }
        break;
      case 14:
        this.usp = val & 0xffff;
        break;
      default:
        this.generals[num] = val & 0xffff;
    }
  }

  reset(): void {
    this.generals.fill(0);
    this.fp = 0;
    this.ssp = 0;
    this.usp = 0;
  }
}
