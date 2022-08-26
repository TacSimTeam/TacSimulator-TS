import { IDmaSignal, IIOSdHostController, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

export class SdHostController implements IIOSdHostController {
  private idleFlag: boolean;
  private errorFlag: boolean;

  private intrFlag: boolean;

  private bufferAddr: number;

  private sectorAddr: number;

  private memory: IDmaSignal;

  /* 割込み信号 */
  private intrSignal: IIntrSignal;

  constructor(memory: IDmaSignal, intrSignal: IIntrSignal) {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.sectorAddr = 0;
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
    this.idleFlag = false;
    this.errorFlag = false;
    this.intrFlag = false;
    this.sectorAddr = 0;
    this.bufferAddr = 0;
  }

  startReading(): void {
    this.idleFlag = false;

    window.electronAPI.readSector(this.sectorAddr);

    if (this.intrFlag) {
      this.intrSignal.interrupt(intr.MICRO_SD);
    }

    this.idleFlag = true;
  }

  startWriting(): void {
    this.idleFlag = false;

    const buf = new Uint8Array(256);

    /* 書き込む値をメモリからコピーしてくる */
    for (let i = 0; i < 256; i++) {
      buf[i] = this.memory.read8(this.bufferAddr + i);
    }

    window.electronAPI.writeSector(this.sectorAddr, buf);

    if (this.intrFlag) {
      this.intrSignal.interrupt(intr.MICRO_SD);
    }

    this.idleFlag = true;
  }

  getMemAddr(): number {
    return this.bufferAddr;
  }

  setMemAddr(addr: number): void {
    this.bufferAddr = addr;
  }

  setSectorAddrHigh(addrHigh: number): void {
    this.sectorAddr = (addrHigh << 16) | (this.sectorAddr & 0x0000ffff);
  }

  setSectorAddrLow(addrLow: number): void {
    this.sectorAddr = (this.sectorAddr & 0xffff0000) | addrLow;
  }

  getSectorAddrHigh(): number {
    return (this.sectorAddr & 0xffff0000) >> 16;
  }

  getSectorAddrLow(): number {
    return this.sectorAddr & 0x0000ffff;
  }
}
