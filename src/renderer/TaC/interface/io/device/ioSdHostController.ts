/**
 * Tacの周辺機器としてのマイクロSDホストコントローラを表現するインターフェース
 */
export interface IIOSdHostController {
  /**
   * ホストコントローラの状態を取得する
   */
  getStat(): number;

  /**
   * ホストコントローラの制御用の値を設定する
   */
  setCtrl(): number;

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
