import * as fs from 'fs/promises';

const SECTOR_SIZE = 512;

export class SDCardImageIOAsync {
  private fHandle: fs.FileHandle | null;
  private buf: Buffer;

  constructor() {
    this.fHandle = null;
    this.buf = Buffer.alloc(SECTOR_SIZE);
  }

  async open(filename: string) {
    this.fHandle = await fs.open(filename, 'r+');
  }

  async readSector(sectorAddr: number) {
    if (this.fHandle === null) {
      throw new Error('ERROR');
    }

    await this.fHandle.read(this.buf, 0, SECTOR_SIZE, sectorAddr * SECTOR_SIZE);

    return this.buf;
  }

  async writeSector(sectorAddr: number, data: Uint8Array) {
    if (this.fHandle === null) {
      throw new Error('ERROR');
    }

    await this.fHandle.write(data, 0, SECTOR_SIZE, sectorAddr * SECTOR_SIZE);
  }

  isLoaded() {
    return this.fHandle !== null;
  }
}
