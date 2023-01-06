/**
 * Tacの周辺機器としてのマイクロSDホストコントローラを表現するインターフェース
 */
export interface IIOSdHostController {
  /**
   * SDからの読み込みを開始する
   */
  startReading(): void;

  /**
   * SDへの書き込みを開始する
   */
  startWriting(): void;

  /**
   * MicroSDとのデータのやり取りに使用するバッファのアドレスを取得する
   *
   * @return バッファ領域の先頭アドレス
   */
  getMemAddr(): number;

  /**
   * MicroSDとのデータのやり取りに使用するバッファのアドレスを取得する
   *
   * @param addr バッファ領域の先頭アドレス
   */
  setMemAddr(addr: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32bitのアドレスの上位16bitを取得する
   */
  getSecAddrH(): number;

  /**
   * データを読み書きするセクタのLBA方式の32bitのアドレスの下位16bitを取得する
   */
  getSecAddrL(): number;

  /**
   * データを読み書きするセクタのLBA方式の32bitのアドレスの上位16bitを設定する
   *
   * @param addrH セクタアドレス上位16bit
   */
  setSecAddrH(addrH: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32bitのアドレスの下位16bitを設定する
   *
   * @param addrL セクタアドレス下位16bit
   */
  setSecAddrL(addrL: number): void;

  /**
   * 処理終了時の割込みを許可するかどうかのフラグを設定する
   *
   * @param flag 割込み許可フラグ
   */
  setIntrFlag(flag: boolean): void;

  /**
   * アイドル状態かどうか確認する
   *
   * @return アイドル状態ならtrue
   */
  isIdle(): boolean;

  /**
   * エラーが発生したかどうか確認する
   *
   * @return エラーが発生しているならtrue
   */
  isErrorOccurred(): boolean;

  /**
   * SDホストコントローラの内部変数を初期化する
   */
  init(): void;
}
