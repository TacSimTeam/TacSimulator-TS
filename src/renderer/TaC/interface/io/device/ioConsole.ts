/**
 * Tacの周辺機器としてのコンソールを表現するインターフェース
 */
export interface IIOConsole {
  /**
   * データSWの値を取得する
   */
  getDataSwitchValue(): number;

  /**
   * Memory Address Registerの値を取得する
   */
  getMemAddrLEDValue(): number;

  /**
   * ロータリSWの位置を取得する
   * (G0=0, G1=1, ..., MA=17)
   */
  getRotSwitchValue(): number;

  /**
   * どのスイッチが押されているかを取得する
   */
  getFuncSwitchValue(): number;

  /**
   * アドレス・データランプのON/OFFを設定する
   *
   * @param val
   */
  setLEDValue(val: number): void;
}
