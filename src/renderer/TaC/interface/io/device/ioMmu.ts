/**
 * Tacの周辺機器としてのコンソールを表現するインターフェース
 */
export interface IIOMmu {
  /**
   * TLBエントリの上位8ビットを設定する
   *
   * @param entryNum TLBエントリの番号
   * @param val 設定したい値
   */
  setTlbHigh8(entryNum: number, val: number): void;

  /**
   * TLBエントリの下位16ビットを設定する
   *
   * @param entryNum TLBエントリの番号
   * @param val 設定したい値
   */
  setTlbLow16(entryNum: number, val: number): void;

  /**
   * TLBエントリの上位8ビットを取得する
   *
   * @param entryNum TLBエントリの番号
   */
  getTlbHigh8(entryNum: number): number;

  /**
   * TLBエントリの下位16ビットを取得する
   *
   * @param entryNum TLBエントリの番号
   */
  getTlbLow16(entryNum: number): number;

  /**
   * メモリ保護違反が発生したときに原因となった論理アドレスを取得する
   */
  getErrorAddr(): number;

  /**
   * メモリ保護違反の原因を取得する
   *
   * 返り値の説明
   * - 0x01 : 奇数アドレスへのアクセス
   * - 0x02 : ページの保護モード違反
   */
  getErrorCause(): number;

  /**
   * TLBミス例外の原因となったページ番号を取得する
   */
  getErrorPage(): number;

  /**
   * MMUを有効にする
   */
  enable(): void;

  /**
   * IPLをメモリから切り離す
   */
  detachIpl(): void;
}
