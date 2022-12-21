import * as fs from 'fs/promises';

const SECTOR_SIZE = 512;

/**
 * SDカードのイメージファイルとの非同期通信を行うクラス
 */
export class SDImgIOAsync {
  private fHandle: fs.FileHandle | null;
  private buf: Uint8Array;

  constructor() {
    this.fHandle = null;
    this.buf = Buffer.alloc(SECTOR_SIZE);
  }

  /**
   * イメージファイルを読み込む
   */
  async open(path: string) {
    /* 既に読み込んでいるSDイメージがあった場合のためにクローズする */
    await this.close();

    try {
      this.fHandle = await fs.open(path, 'r+');
    } catch (e) {
      throw new Error(`イメージファイルが開けませんでした : ${path}`);
    }
  }

  /**
   * 指定したセクタ番号の箇所を非同期に読み出す
   */
  async readSct(sctAddr: number) {
    if (this.fHandle === null) {
      throw new Error('イメージファイルをオープンしていません');
    }

    await this.fHandle.read(this.buf, 0, SECTOR_SIZE, sctAddr * SECTOR_SIZE);

    return this.buf;
  }

  /**
   * 指定したセクタ番号の箇所に非同期に書き込む
   */
  async writeSct(sctAddr: number, data: Uint8Array) {
    if (this.fHandle === null) {
      throw new Error('イメージファイルをオープンしていません');
    }

    await this.fHandle.write(data, 0, SECTOR_SIZE, sctAddr * SECTOR_SIZE);
  }

  /**
   * イメージファイルが読み込まれているかどうか
   */
  isLoaded(): boolean {
    return this.fHandle !== null;
  }

  /**
   * イメージファイルをクローズする
   */
  async close() {
    if (this.fHandle !== null) {
      await this.fHandle.close();
    }
  }
}
