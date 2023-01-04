/**
 * Tacの周辺機器としてのタイマーを表現するインターフェース
 */
export interface IIOTimer {
  /**
   * タイマーの現在値を取得する
   *
   * @return タイマーのカウンタの現在値
   */
  getCounter(): number;

  /**
   * カウンタの値と周期レジスタの値が一致すると
   * 1になるフラグの値を取得する
   *
   * 読み出されるとリセットされる
   *
   * @return カウンタの値と周期の値が一致したならtrue
   */
  isMatched(): boolean;

  /**
   * タイマーの周期を設定する
   *
   * @param cycle 周期の値
   */
  setCycle(cycle: number): void;

  /**
   * タイマーの割り込み許可フラグを設定する
   *
   * @param flag タイマー割り込みを許可するかどうか
   */
  setIntrFlag(flag: boolean): void;

  /**
   * タイマーをスタートする
   */
  start(): void;

  /**
   * タイマーをストップする
   */
  stop(): void;
}
