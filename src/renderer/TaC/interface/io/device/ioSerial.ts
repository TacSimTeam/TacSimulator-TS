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
   * シリアル入出力装置の状態を取得する
   */
  getStat(): number;

  /**
   * シリアル入出力装置の制御用の値を設定する
   */
  setCtrl(): number;
}
