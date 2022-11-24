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
   */
  getFlags(): number;

  /**
   * フラグの値を設定する
   *
   * @param flags フラグの値
   */
  setFlags(flags: number): void;

  /**
   * 引数に指定したフラグが立っているかを確認する
   *
   * @param flag 確認したいフラグのビットが1の値
   */
  evalFlag(flag: number): boolean;

  /**
   * PSWの中身をリセットする
   * pcは0xe000, flagsはPフラグのみ立っている状態になる
   */
  reset(): void;
}
