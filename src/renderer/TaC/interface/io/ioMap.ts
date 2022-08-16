/**
 * I/O空間を表現するインターフェース
 */
export interface IIOMap {
  /**
   * 16bitのデータをI/O空間に書き込む
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ(16bit)
   */
  write16(addr: number, val: number): void;

  /**
   * 16bitのデータをI/O空間から読み込む
   *
   * @param addr 読み込むデータのアドレス
   */
  read16(addr: number): number;
}
