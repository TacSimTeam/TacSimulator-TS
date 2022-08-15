import { IIntrSignal } from '.';

/**
 * 割込みコントローラを表現するインターフェース
 */
export interface IIntrController extends IIntrSignal {
  /**
   * 割込みが発生しているか確認する
   *
   * 発生していた場合は割込み番号, していない場合は-1を返す
   * 確認された割込みのフラグは0に初期化される
   */
  checkIntrNum(): number;

  /**
   * 例外が発生していればtrueを返す
   *
   * 割込みフラグは変化しない
   */
  isOccurredException(): boolean;
}
