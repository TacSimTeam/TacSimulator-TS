/**
 * Tacの周辺機器としてのマイクロSDホストコントローラを表現するインターフェース
 */
export interface IIOSdHostController {
  /**
   * アイドル状態かどうか
   */
  isIdle(): boolean;

  /**
   * エラーが発生したかどうか
   */
  isErrorOccurred(): boolean;

  /**
   * 処理終了時の割り込みを許可するかどうかのフラグを設定する
   *
   * @param flag フラグの値
   */
  setIntrFlag(flag: boolean): void;

  /**
   * SDホストコントローラの内部変数を初期化する
   */
  init(): void;

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
   */
  getMemAddr(): number;

  /**
   * MicroSDとのデータのやり取りに使用するバッファのアドレスを取得する
   *
   * @param addr バッファのアドレス
   */
  setMemAddr(addr: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの上位16ビットを設定する
   *
   * @param addrH セクタアドレス上位16ビット
   */
  setSecAddrH(addrH: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの下位16ビットを設定する
   *
   * @param addrL セクタアドレス下位16ビット
   */
  setSecAddrL(addrL: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの上位16ビットを取得する
   */
  getSecAddrH(): number;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの下位16ビットを取得する
   */
  getSecAddrL(): number;
}
