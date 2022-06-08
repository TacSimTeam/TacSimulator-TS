import { IDataBus, IDmaSignal, IIplLoader } from '../interface';
import { ipl } from '../ipl';

export class Mmu implements IDataBus, IDmaSignal, IIplLoader {
  private memory: IDmaSignal;

  // IPLロード中ならtrue
  private iplMode: boolean;

  constructor(memory: IDmaSignal) {
    this.memory = memory;
    this.iplMode = false;
  }

  write16(addr: number, val: number) {
    if (addr % 2 == 1) {
      console.log('奇数アドレス参照');
    }
    if (this.iplMode) {
      if (addr >= 0xe000) {
        console.log('IPLロード中は0xe000~0xffffがReadonlyです');
        return;
      }
    }

    this.memory.write8(addr, (val & 0xff00) >> 8);
    this.memory.write8(addr + 1, val & 0x00ff);
  }

  read16(addr: number) {
    if (addr % 2 == 1) {
      console.log('奇数アドレス参照');
    }
    return (this.memory.read8(addr) << 8) | this.memory.read8(addr + 1);
  }

  write8(addr: number, val: number): void {
    this.memory.write8(addr, val);
  }

  read8(addr: number): number {
    return this.memory.read8(addr);
  }

  loadIpl() {
    for (let i = 0; i < ipl.length; i++) {
      this.write16(0xe000 + i * 2, ipl[i]);
    }
    this.iplMode = true;
  }

  detachIpl() {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
  }
}
