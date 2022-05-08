import { Memory } from './memory';
import { ipl } from '../ipl';

export class Mmu {
  private memory: Memory;

  /* IPLロード中ならtrue */
  private iplMode: boolean;

  constructor() {
    this.memory = new Memory();
    this.iplMode = false;
  }

  write(addr: number, val: number) {
    if (addr % 2 == 1) {
      console.log('奇数アドレス参照');
    }
    if (this.iplMode) {
      if (addr >= 0xe000) {
        console.log('IPLロード中は0xe000~0xffffがReadonlyです');
        return;
      }
    }

    this.memory.write(addr, (val & 0xff00) >> 8);
    this.memory.write(addr + 1, val & 0x00ff);
  }

  read(addr: number) {
    if (addr % 2 == 1) {
      console.log('奇数アドレス参照');
    }
    return (this.memory.read(addr) << 8) | this.memory.read(addr + 1);
  }

  loadIpl() {
    for (let i = 0; i < ipl.length; i++) {
      this.write(0xe000 + i * 2, ipl[i]);
    }
    this.iplMode = true;
  }

  detachIpl() {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write(i, 0);
    }
  }
}
