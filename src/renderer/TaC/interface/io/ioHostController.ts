/**
 * TaCの周辺機器を管理するコントローラを表現するインターフェース
 */
export interface IIOHostController {
  /**
   * I/O空間からデータを読み込む
   *
   * @param addr 読み込むデータのアドレス
   * @return I/O空間から読み込んだ16bitデータ
   */
  input(addr: number): number;

  /**
   * I/O空間にデータを書き込む
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ
   */
  output(addr: number, val: number): void;
}
