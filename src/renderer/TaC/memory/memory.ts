import { IDmaSignal } from '../interface';

const MEMORY_SIZE = 64 * 1024; // Tacのメモリサイズは64KiB

export class Memory implements IDmaSignal {
  private mem: Uint8Array;
  private readonly size: number;

  constructor() {
    this.size = MEMORY_SIZE;
    this.mem = new Uint8Array(this.size);
  }

  write8(addr: number, val: number): void {
    this.mem[addr] = val;
  }

  read8(addr: number): number {
    return this.mem[addr];
  }

  write16(addr: number, val: number): void {
    this.write8(addr, (val & 0xff00) >> 8);
    this.write8(addr + 1, val & 0x00ff);
  }

  read16(addr: number): number {
    return (this.read8(addr) << 8) | this.read8(addr + 1);
  }

  getMemorySize(): number {
    return this.size;
  }
}
