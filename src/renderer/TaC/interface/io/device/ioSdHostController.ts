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
  isOccurredError(): boolean;

  /**
   * 処理終了時の割り込みを許可するかどうかのフラグを設定する
   *
   * @param flag
   */
  setInterruptFlag(flag: boolean): void;

  /**
   * SDをSPIモードに切り替え使用できるように初期化する
   * 現時点では実装予定無し
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
   * @param addr
   */
  setMemAddr(addr: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの上位16ビットを設定する
   *
   * @param addrHigh
   */
  setSectorAddrHigh(addrHigh: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの下位16ビットを設定する
   *
   * @param addrLow
   */
  setSectorAddrLow(addrLow: number): void;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの上位16ビットを取得する
   */
  getSectorAddrHigh(): number;

  /**
   * データを読み書きするセクタのLBA方式の32ビットのアドレスの下位16ビットを取得する
   */
  getSectorAddrLow(): number;
}
