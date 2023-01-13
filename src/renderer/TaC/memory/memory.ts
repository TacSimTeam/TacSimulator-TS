import { IDataBus, IDmaSignal } from '../interface';

const MEMORY_SIZE = 64 * 1024; // Tacのメモリサイズは64KiB

export class Memory implements IDmaSignal, IDataBus {
  private mem: Uint8Array;
  private readonly size: number;

  constructor() {
    this.size = MEMORY_SIZE;
    this.mem = new Uint8Array(this.size);
  }

  read8(addr: number): number {
    return this.mem[addr];
  }

  write8(addr: number, val: number): void {
    this.mem[addr] = val;
  }

  read16(addr: number): number {
    return (this.read8(addr) << 8) | this.read8(addr + 1);
  }

  write16(addr: number, val: number): void {
    this.write8(addr, (val & 0xff00) >> 8);
    this.write8(addr + 1, val & 0x00ff);
  }

  fetch(pc: number): number {
    return this.read16(pc);
  }
}
