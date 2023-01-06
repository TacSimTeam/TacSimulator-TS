/**
 * Tacの周辺機器としてのコンソールを表現するインターフェース
 */
export interface IIOMmu {
  /**
   * TLBエントリの上位8bitを取得する
   *
   * @param entryNum TLBエントリの番号
   * @return TLBエントリの上位8bit
   */
  getTlbHigh8(entryNum: number): number;

  /**
   * TLBエントリの下位16bitを取得する
   *
   * @param entryNum TLBエントリの番号
   * @return TLBエントリの下位16bit
   */
  getTlbLow16(entryNum: number): number;

  /**
   * TLBエントリの上位8bitを設定する
   *
   * @param entryNum TLBエントリの番号
   * @param val TLBエントリの上位8bit
   */
  setTlbHigh8(entryNum: number, val: number): void;

  /**
   * TLBエントリの下位16bitを設定する
   *
   * @param entryNum TLBエントリの番号
   * @param val TLBエントリの下位16bit
   */
  setTlbLow16(entryNum: number, val: number): void;

  /**
   * メモリ保護違反が発生したときに原因となった論理アドレスを取得する
   *
   * @return メモリ保護違反の原因となった論理アドレス
   */
  getErrorAddr(): number;

  /**
   * メモリ保護違反の原因を取得する
   *
   * @return メモリ保護違反の原因
   * - 0x01 : 奇数アドレスへのアクセス
   * - 0x02 : ページの保護モード違反
   */
  getErrorCause(): number;

  /**
   * TLBミス例外の原因となったページ番号を取得する
   *
   * @return TLBミス例外の原因となったページ番号
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
