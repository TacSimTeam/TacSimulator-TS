export const REGISTER_G0 = 0;
export const REGISTER_G1 = 1;
export const REGISTER_G2 = 2;
export const REGISTER_G3 = 3;
export const REGISTER_G4 = 4;
export const REGISTER_G5 = 5;
export const REGISTER_G6 = 6;
export const REGISTER_G7 = 7;
export const REGISTER_G8 = 8;
export const REGISTER_G9 = 9;
export const REGISTER_G10 = 10;
export const REGISTER_G11 = 11;
export const REGISTER_FP = 12;
export const REGISTER_SP = 13;
export const REGISTER_USP = 14;

/* フラグ(15番のレジスタ)はCPU側が保持する */
export const REGISTER_FLAG = 15;

export class Register {
  private generals: Uint16Array;
  private fp: number;
  private ssp: number;
  private usp: number;

  /* privMode = trueなら特権モード */
  private privMode: boolean;

  constructor() {
    this.generals = new Uint16Array(12);
    this.fp = 0;
    this.ssp = 0;
    this.usp = 0;
    this.privMode = false;

    this.reset();
  }

  reset() {
    this.generals.fill(0);
    this.fp = 0;
    this.ssp = 0;
    this.usp = 0;
  }

  setPrivMode(flag: boolean) {
    this.privMode = flag;
  }

  readReg(num: number) {
    switch (num) {
      case 12:
        return this.fp;
      case 13:
        if (this.privMode) {
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

  writeReg(num: number, val: number) {
    switch (num) {
      case 12:
        this.fp = val;
        break;
      case 13:
        if (this.privMode) {
          this.ssp = val;
        } else {
          this.usp = val;
        }
        break;
      case 14:
        this.usp = val;
        break;
      default:
        this.generals[num] = val;
    }
  }
}
