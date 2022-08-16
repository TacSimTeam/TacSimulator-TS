/**
 * Tacの周辺機器としてのタイマーを表現するインターフェース
 */
export interface IIOTimer {
  /**
   * タイマーのカウンタの現在地を取得する
   */
  getCounter(): number;

  /**
   * タイマーのフラグを取得する
   */
  getFlag(): number;

  /**
   * タイマーの周期を設定する
   *
   * @param cycle
   */
  setCycle(cycle: number): void;

  /**
   * タイマーの制御用の値を設定する
   */
  setCtrl(): number;
}
