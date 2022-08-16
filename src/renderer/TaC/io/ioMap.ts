import { IIOMap } from '../interface';

/* TacのI/O空間のサイズは256Byte(128ワード) */
const IOMAP_SIZE = 256;

export class IOMap implements IIOMap {
  private map: Uint8Array;
  private size: number;

  constructor() {
    this.size = IOMAP_SIZE;
    this.map = new Uint8Array(this.size);
  }

  read16(addr: number): number {
    return (this.map[addr] << 8) | this.map[addr + 1];
  }

  write16(addr: number, val: number): void {
    this.map[addr] = (val & 0xff00) >> 8;
    this.map[addr + 1] = val & 0x00ff;
  }
}
