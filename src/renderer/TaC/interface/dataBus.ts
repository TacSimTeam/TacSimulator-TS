/**
 * データバスを表現するインターフェース
 *
 * CPUやIOはこのインターフェースを実装するメモリ(MMU)を参照する
 */
export interface IDataBus {
  /**
   * 16bitのデータをメモリに書き込む
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ(16bit)
   */
  write16(addr: number, val: number): void;

  /**
   * 16bitのデータをメモリから読み込む
   *
   * @param addr 読み込むデータのアドレス
   */
  read16(addr: number): number;
}
