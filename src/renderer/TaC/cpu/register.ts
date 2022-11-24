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

  reset() {
    this.generals.fill(0);
    this.fp = 0;
    this.ssp = 0;
    this.usp = 0;
  }

  read(num: number) {
    switch (num) {
      case 12:
        return this.fp;
      case 13:
        if (this.privSig.getPrivMode()) {
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

  write(num: number, val: number) {
    switch (num) {
      case 12:
        this.fp = val & 0xffff;
        break;
      case 13:
        if (this.privSig.getPrivMode()) {
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
}
