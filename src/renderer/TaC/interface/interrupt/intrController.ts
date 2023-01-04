import { IIntrSignal } from './intrSignal';

/**
 * 割込みコントローラを表現するインターフェース
 */
export interface IIntrController extends IIntrSignal {
  /**
   * 割込み(例外)が発生しているか確認する
   *
   * @return 発生していた場合は割込み番号, していない場合はnull
   */
  checkIntrNum(): number | null;

  /**
   * 例外が発生しているか確認する
   * 例外は割込み許可フラグが0でもCPU内で処理される
   *
   * @return 例外が発生していればtrue, そうでなければfalse
   */
  isExceptionOccurred(): boolean;
}
