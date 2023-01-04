/**
 * 割込みを発生させる機器を表現するインターフェース
 */
export interface IIntrSignal {
  /**
   * 割込み(例外)発生時に呼び出す
   *
   * @param intrNum 割込み番号
   */
  interrupt(intrNum: number): void;
}
