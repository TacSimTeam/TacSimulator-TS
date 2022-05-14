/**
 * Direct Memory Accessを表現するインターフェース
 *
 * コンソールやマイクロSDコントローラといったメモリとDMA方式で接続される機器は
 * このインターフェースを実装するメモリを参照する
 */
export interface IDmaSignal {
  /**
   * 8bitのデータをメモリに書き込む
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ(8bit)
   */
  write8(addr: number, val: number): void;

  /**
   * 8bitのデータをメモリから読み込む
   *
   * @param addr 読み込むデータのアドレス
   */
  read8(addr: number): number;
}
