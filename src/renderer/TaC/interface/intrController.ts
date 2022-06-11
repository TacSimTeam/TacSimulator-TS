/**
 * 割込みコントローラを表現するインターフェース
 *
 * 割込みを発生させる機器はこのインターフェースを実装するコントローラを参照する
 */
export interface IIntrController {
  /**
   * 割込み(例外)発生時に呼び出す
   *
   * @param intrNum 割込み番号
   */
  interrupt(intrNum: number): void;
}
