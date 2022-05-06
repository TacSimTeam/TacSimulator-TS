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
    if (this.iplMode) {
      if (addr >= 0xe000) {
        console.log('IPLロード中は0xe000~0xffffがReadonlyです');
        return;
      }
    }
    this.memory.write(addr, val);
  }

  read(addr: number) {
    this.memory.read(addr);
  }

  loadIpl() {
    this.iplMode = true;
    for (let i = 0; i <= 0xffff; i++) {
      this.memory.write(0xe000 + i, ipl[i]);
    }
  }

  detachIpl() {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write(i, 0);
    }
  }
}
