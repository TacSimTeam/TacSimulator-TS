/**
 * Tacの周辺機器としてのコンソールを表現するインターフェース
 */
export interface IIOMmu {
  /**
   * TLBエントリの上位8ビットを設定する
   *
   * @param idx TLBエントリの番号(0~7)
   * @param val
   */
  setTlbHigh8(idx: number, val: number): void;

  /**
   * TLBエントリの下位16ビットを設定する
   *
   * @param idx TLBエントリの番号(0~7)
   * @param val
   */
  setTlbLow16(idx: number, val: number): void;

  /**
   * TLBエントリの上位8ビットを取得する
   *
   * @param idx TLBエントリの番号(0~7)
   */
  getTlbHigh8(idx: number): number;

  /**
   * TLBエントリの下位16ビットを取得する
   *
   * @param idx TLBエントリの番号(0~7)
   */
  getTlbLow16(idx: number): number;

  /**
   * メモリ保護違反が発生したときに原因となった論理アドレスを取得する
   */
  getErrorAddr(): number;

  /**
   * メモリ保護違反の原因を取得する
   *
   * @return
   * - 0x01 : 奇数アドレスへのアクセス
   * - 0x02 : ページの保護モード違反
   */
  getErrorCause(): number;

  /**
   * TLBミス例外の原因となったページ番号を取得する
   */
  getTlbMissPage(): number;

  /**
   * MMUを有効にする
   */
  enableMmu(): void;

  /**
   * IPLをメモリから切り離す
   */
  detachIpl(): void;
}
