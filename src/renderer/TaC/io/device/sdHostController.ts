import { IDmaSignal, IIOSdHostController, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

const SECTOR_SIZE = 512;

/**
 * TaCのマイクロSDホストコントローラを再現したもの
 */
export class SdHostController implements IIOSdHostController {
  private idleFlag: boolean;
  private errorFlag: boolean;

  /* trueであれば処理終了後に割り込みを発生させる */
  private intrFlag: boolean;

  private bufferAddr: number;

  private secAddrH: number;
  private secAddrL: number;

  private memory: IDmaSignal;

  /* 割込み信号 */
  private intrSignal: IIntrSignal;

  constructor(memory: IDmaSignal, intrSignal: IIntrSignal) {
    this.idleFlag = false;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
    this.bufferAddr = 0;
    this.memory = memory;
    this.intrSignal = intrSignal;
  }

  isIdle(): boolean {
    return this.idleFlag;
  }

  isOccurredError(): boolean {
    return this.errorFlag;
  }

  setInterruptFlag(flag: boolean): void {
    this.intrFlag = flag;
  }

  init(): void {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
  }

  startReading(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    window.electronAPI
      .readSector(this.sectorAddr())
      .then((data) => {
        /* 読み込んだ値をメモリにコピーする */
        for (let i = 0; i < SECTOR_SIZE; i++) {
          this.memory.write8(this.bufferAddr + i, data[i]);
        }
      })
      .then(() => {
        this.idleFlag = true;
        if (this.intrFlag) {
          this.intrSignal.interrupt(intr.MICRO_SD);
        }
      })
      .catch(() => {
        this.errorFlag = true;
        this.idleFlag = false;
      });
  }

  startWriting(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    new Promise<void>(() => {
      const data = new Uint8Array(SECTOR_SIZE);

      /* 書き込む値をメモリからコピーしてくる */
      for (let i = 0; i < SECTOR_SIZE; i++) {
        data[i] = this.memory.read8(this.bufferAddr + i);
      }

      window.electronAPI
        .writeSector(this.sectorAddr(), data)
        .then(() => {
          this.idleFlag = true;
          if (this.intrFlag) {
            this.intrSignal.interrupt(intr.MICRO_SD);
          }
        })
        .catch(() => {
          this.errorFlag = true;
          this.idleFlag = false;
        });
    });
  }

  getMemAddr(): number {
    return this.bufferAddr;
  }

  setMemAddr(addr: number): void {
    this.bufferAddr = addr;
  }

  setSectorAddrHigh(addrHigh: number): void {
    this.secAddrH = addrHigh;
  }

  setSectorAddrLow(addrLow: number): void {
    this.secAddrL = addrLow;
  }

  getSectorAddrHigh(): number {
    return this.secAddrH;
  }

  getSectorAddrLow(): number {
    return this.secAddrL;
  }

  private sectorAddr() {
    return (this.secAddrH << 16) + this.secAddrL;
  }

  reset() {
    this.idleFlag = false;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
    this.bufferAddr = 0;
  }
}
