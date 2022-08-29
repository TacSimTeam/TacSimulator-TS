import * as fs from 'fs';

const SECTOR_SIZE = 512;

/* バックグラウンドで保持するSDカードイメージファイルを管理するクラス */
export class SDImageIO {
  private fd: number;
  private buf: Buffer;

  constructor() {
    this.fd = -1;
    this.buf = Buffer.alloc(SECTOR_SIZE);
  }

  isLoaded() {
    return this.fd !== -1;
  }

  readSector(sectorAddr: number) {
    try {
      fs.readSync(this.fd, this.buf, 0, SECTOR_SIZE, sectorAddr * SECTOR_SIZE);
    } catch (e) {
      this.buf.fill(0);
    }
    return Uint8Array.from(this.buf);
  }

  writeSector(sectorAddr: number, data: Uint8Array) {
    try {
      fs.writeSync(this.fd, data, sectorAddr * SECTOR_SIZE);
    } catch (e) {
      console.log(e);
    }
  }

  open(filename: string) {
    try {
      this.fd = fs.openSync(filename, 'r+');
      console.log('fd : ' + this.fd + ', filename : ' + filename);
    } catch (e) {
      this.fd = -1;
    }
  }
}
