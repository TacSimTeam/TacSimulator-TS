/**
 * CPUが特権モードであるべきかを知る必要がある機器が参照するインターフェース
 *
 * MEMO(2022/08/17):
 * MMUがCPUの実行モードによってページングを使用するか変える挙動を
 * プログラム上で実現するためにこのようなインターフェースを持つクラスを
 * 実装する必要があると考えた
 * MMU側にsetPrivMode()が公開されているのは良くないが、後で直せれば直す
 */
export interface IPrivModeSignal {
  getPrivMode(): boolean;
  setPrivMode(flag: boolean): void;
}
