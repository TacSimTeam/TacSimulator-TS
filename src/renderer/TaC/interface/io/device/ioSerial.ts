/**
 * Tacの周辺機器としてのシリアル入出力装置を表現するインターフェース
 */
export interface IIOSerial {
  /**
   * 1バイトのデータを送信する
   *
   * @param val
   */
  send(val: number): void;

  /**
   * 1バイトのデータを受信する
   */
  receive(): number;

  /**
   * 送信データが書き込み可能であるかどうか
   */
  getWriteableFlag(): boolean;

  /**
   * 受信データが読み込み可能であるかどうか
   */
  getReadableFlag(): boolean;

  /**
   * 次の受信データが書き込み可能になるときに
   * 割込み可能とするフラグを設定する
   *
   * @param flag
   */
  setWriteableIntrFlag(flag: boolean): void;

  /**
   * 次の受信データが読み込み可能になるときに
   * 割込み可能とするフラグを設定する
   *
   * @param flag
   */
  setReadableIntrFlag(flag: boolean): void;
}
