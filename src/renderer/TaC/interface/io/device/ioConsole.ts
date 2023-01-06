/**
 * Tacの周辺機器としてのコンソールを表現するインターフェース
 */
export interface IIOConsole {
  /**
   * Memory Address Registerの値を取得する
   *
   * @return MAレジスタの値
   */
  getMemAddr(): number;

  /**
   * データスイッチの値を取得する
   *
   * @return データSWの値(SWがONになっている位置のbitが1)
   */
  getDataSwitch(): number;

  /**
   * ロータリSWの位置を取得する
   *
   * @return ロータリSWの位置(G0=0, G1=1, ..., MA=17)
   */
  getRotSwitch(): number;

  /**
   * どのスイッチが押されているかを取得する
   *
   * @return 押されているスイッチの種類
   */
  getFuncSwitch(): number;

  /**
   * アドレス・データランプのON/OFFを設定する
   *
   * @param val 設定したい値
   */
  setLEDLamps(val: number): void;
}
