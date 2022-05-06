const MEMORY_SIZE = 64 * 1024;

export class Memory {
  private mem: Uint8Array;

  constructor() {
    this.mem = new Uint8Array(MEMORY_SIZE);
  }

  write(addr: number, val: number) {
    this.mem[addr] = val;
  }

  read(addr: number) {
    return this.mem[addr];
  }
}
