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
   * PCの値を設定する
   */
  setPC(pc: number): void;

  /**
   * フラグの値を取得する
   */
  getFlags(): number;

  /**
   * フラグの値を設定する
   */
  setFlags(flags: number): void;

  /**
   * 引数に指定したフラグが立っているかを確認する
   */
  evalFlag(flag: number): boolean;

  /**
   * PSWの中身をリセットする
   * pcは0xe000, flagsはPフラグのみ立っている状態になる
   */
  reset(): void;
}
