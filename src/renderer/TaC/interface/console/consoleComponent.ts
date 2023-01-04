/**
 * コンソールのGUI部品を表現するインターフェース
 */
export interface IConsoleComponent {
  /**
   * 部品を描画する
   */
  draw(): void;

  /**
   * クリックされた時の動作を実行する
   *
   * @param clickPosX クリックしたx座標
   * @param clickPosY クリックしたy座標
   */
  onClick(clickPosX: number, clickPosY: number): void;
}
