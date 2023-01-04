/**
 * キーボードの入力を受け取る機器を表現するインターフェース
 *
 * HTMLElement.onkeydown(), HTMLElement.onkeyup()の引数の無名関数の中で
 * このインターフェースを実装する機器の関数を指定する
 */
export interface IKeyboardDriver {
  /**
   * キーが押された時の動作
   *
   * @param e this.terminal.onkeydownで取得する入力情報
   */
  inputKeyDown(e: KeyboardEvent): void;
}
