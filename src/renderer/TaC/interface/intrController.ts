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

  /**
   * 割込みが発生しているか確認する
   *
   * 発生していた場合は割込み番号, していない場合は-1を返す
   * 確認された割込みのフラグは0に初期化される
   */
  checkIntrNum(): number;

  /**
   * 例外が発生しているか検査する
   *
   * 割込みフラグは変化しない
   */
  isOccurredException(): boolean;
}
