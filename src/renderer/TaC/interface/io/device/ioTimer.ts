/**
 * Tacの周辺機器としてのタイマーを表現するインターフェース
 */
export interface IIOTimer {
  /**
   * タイマーのカウンタの現在地を取得する
   */
  getCounter(): number;

  /**
   * カウンタの値と周期レジスタの値が一致すると
   * 1になるフラグの値を取得する
   *
   * 読み出されるとリセットされる
   */
  getMatchFlag(): boolean;

  /**
   * タイマーの周期を設定する
   *
   * @param cycle
   */
  setCycle(cycle: number): void;

  /**
   * タイマー割り込みを許可するかどうかのフラグを設定する
   *
   * @param flag
   */
  setInterruptFlag(flag: boolean): void;

  /**
   * カウンタをリセットしてからタイマーをスタートする
   */
  start(): void;

  /**
   * カウンタをリセットしてからタイマーをストップする
   */
  stop(): void;
}
