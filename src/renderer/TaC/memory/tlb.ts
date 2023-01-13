/**
 * TLBの1エントリを表現するクラス
 */
export class TlbEntry {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  getHigh8(): number {
    return (this.value & 0x00ff0000) >> 16;
  }

  getLow16(): number {
    return this.value & 0xffff;
  }

  setHigh8(value: number): void {
    this.value = ((value & 0xffff) << 16) | (this.value & 0xffff);
  }

  setLow16(value: number): void {
    this.value = (this.value & 0xffff0000) | (value & 0xffff);
  }

  getPage(): number {
    return this.getHigh8();
  }

  getFrame(): number {
    return this.value & 0xff;
  }

  isValid(): boolean {
    return (this.value & (1 << 15)) !== 0;
  }

  isReadable(): boolean {
    return (this.value & (1 << 10)) !== 0;
  }

  isWritable(): boolean {
    return (this.value & (1 << 9)) !== 0;
  }

  isExecutable(): boolean {
    return (this.value & (1 << 8)) !== 0;
  }

  setReferenceFlag(): void {
    this.value |= 1 << 12;
  }

  setDirtyFlag(): void {
    this.value |= 1 << 11;
  }

  reset(): void {
    this.value = 0;
  }
}
