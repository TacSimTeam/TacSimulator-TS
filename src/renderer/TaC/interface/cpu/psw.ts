/**
 * PSW(Program Status Word)を表現するインターフェース
 */
export interface IPsw {
  /**
   * PCの値を2(1ワード分)進める
   */
  nextPC(): void;

  /**
   * PCの値を取得する
   *
   * @return PCの値
   */
  getPC(): number;

  /**
   * 引数に指定した番地にジャンプする
   *
   * @param pc ジャンプ先アドレス
   */
  jumpTo(addr: number): void;

  /**
   * フラグの値を取得する
   *
   * @return フラグの値(00000000 EPIUVCSZ)
   */
  getFlags(): number;

  /**
   * フラグの値を設定する
   *
   * @param flags フラグの値(00000000 EPIUVCSZ)
   */
  setFlags(flags: number): void;

  /**
   * 引数に指定したフラグが立っているかを確認する
   *
   * @param flag 確認したいフラグのビットが1の値
   *             例) Iビットを確認したいなら00100000
   * @return フラグが1ならtrue
   */
  checkFlag(flag: number): boolean;
}
