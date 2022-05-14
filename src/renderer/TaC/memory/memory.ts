import { IDmaSignal } from '../interface/dmaSignal';

const MEMORY_SIZE = 64 * 1024;

export class Memory implements IDmaSignal {
  private mem: Uint8Array;

  constructor() {
    this.mem = new Uint8Array(MEMORY_SIZE);
  }

  write8(addr: number, val: number) {
    this.mem[addr] = val;
  }

  read8(addr: number) {
    return this.mem[addr];
  }
}
