/**
 * Tacの周辺機器としてのシリアル入出力装置を表現するインターフェース
 */
export interface IIOSerial {
  /**
   * 1バイトのデータを送信する
   */
  send(val: number): void;

  /**
   * 1バイトのデータを受信する
   */
  receive(): number;

  /**
   * 送信データが書き込み可能であるかどうか
   */
  isWriteable(): boolean;

  /**
   * 受信データが読み込み可能であるかどうか
   */
  isReadable(): boolean;

  /**
   * 次のデータが送信可能になるときに割込み可能とするフラグを設定する
   */
  setSendableIntrFlag(flag: boolean): void;

  /**
   * 次のデータが受信可能になるときに割込み可能とするフラグを設定する
   */
  setReceivableIntrFlag(flag: boolean): void;
}
