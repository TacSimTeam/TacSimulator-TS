/**
 * 割込みを実際に処理する機器を表現するインターフェース
 *
 * 割込みコントローラはこのインターフェースを実装する機器から割込み処理を実行する
 */
export interface IIntrHandler {
  /**
   * 以下の順序で割込み処理を行う
   * 1. 現在のFLAGの一時コピーを作成する
   * 2. FLAGをE=0(割込み禁止), P=1(特権モード)に変更する
   * 3. PC, FLAGのコピーを順にカーネルスタックにPUSHする
   * 4. PCに割込みハンドラの開始番地をロードする
   *
   * @param intrNum 割込み番号
   */
  handleInterrupt(intrNum: number): void;
}
