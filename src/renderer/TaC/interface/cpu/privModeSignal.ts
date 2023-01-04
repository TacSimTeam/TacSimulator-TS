/**
 * CPUが特権モードであるべきかを知る必要がある機器が参照するインターフェース
 *
 * MMUがCPUの実行モードによってページングを使用するか変える挙動を
 * プログラム上で実現するためにこのようなインターフェースを持つクラスを
 * 実装する必要がある
 */
export interface IPrivModeSignal {
  /**
   * 現在のPフラグの値を取得する
   *
   * @return 現在のPフラグの値(1=true, 0=false)
   */
  getPrivFlag(): boolean;

  /**
   * Pフラグの値を書き換える
   *
   * @param flag Pフラグの値(1=true, 0=false)
   */
  setPrivFlag(flag: boolean): void;
}
