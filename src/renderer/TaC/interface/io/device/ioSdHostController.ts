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
   * マイクロSDの読み書きに使用するバッファ領域の先頭アドレスを取得する
   *
   * @return バッファ領域の先頭アドレス
   */
  getMemAddr(): number;

  /**
   * マイクロSDの読み書きに使用するバッファ領域の先頭アドレスを設定する
   *
   * @param addr バッファ領域の先頭アドレス
   */
  setMemAddr(addr: number): void;

  /**
   * データを読み書きするセクタアドレス(LBA方式，32bit)の上位16bitを取得する
   */
  getSecAddrH(): number;

  /**
   * データを読み書きするセクタアドレス(LBA方式，32bit)の下位16bitを取得する
   */
  getSecAddrL(): number;

  /**
   * データを読み書きするセクタアドレス(LBA方式，32bit)の上位16bitを設定する
   *
   * @param addrH セクタアドレス上位16bit
   */
  setSecAddrH(addrH: number): void;

  /**
   * データを読み書きするセクタアドレス(LBA方式，32bit)の下位16bitを設定する
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
