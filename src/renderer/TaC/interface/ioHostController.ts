import { IIODevice } from '.';

/**
 * TaCの周辺機器を管理するコントローラを表現するインターフェース
 *
 * 実際のTaCにこのような機構は無いが、
 * 今後増える可能性もあるI/O機器の一括管理と、I/O空間とCPUを繋ぐために定義する
 */
export interface IIOHostController {
  /**
   * 周辺機器を追加する
   *
   * @param device 接続する周辺機器
   */
  appendIODevice(device: IIODevice): void;

  /**
   * I/O空間からデータを読み込む
   *
   * @param addr 読み込むデータのアドレス
   */
  input(addr: number): number;

  /**
   * I/O空間にデータを書き込む
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ(16bit)
   */
  output(addr: number, val: number): void;
}
