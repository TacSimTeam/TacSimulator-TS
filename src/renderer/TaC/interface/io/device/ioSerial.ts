/**
 * Tacの周辺機器としてのシリアル入出力装置を表現するインターフェース
 */
export interface IIOSerial {
  /**
   * 1byteデータを受信する
   *
   * @return 1byteデータ
   */
  receive(): number;

  /**
   * 1byteデータを送信する
   *
   * @param val 送信したい1byteデータ
   */
  send(val: number): void;

  /**
   * 次のデータが受信可能になるときに割込み可能とするフラグを設定する
   *
   * @param flag 受信可能時の割込み可能フラグ
   */
  setReceivableIntrFlag(flag: boolean): void;

  /**
   * 次のデータが送信可能になるときに割込み可能とするフラグを設定する
   *
   * @param flag 送信可能時の割込み可能フラグ
   */
  setSendableIntrFlag(flag: boolean): void;

  /**
   * 受信可能か確認する
   *
   * @return 受信データが読込み可能ならtrue
   */
  isReadable(): boolean;

  /**
   * 送信可能か確認する
   *
   * @return 送信データが書込み可能ならtrue
   */
  isWriteable(): boolean;
}
