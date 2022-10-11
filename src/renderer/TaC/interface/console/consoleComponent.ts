/**
 * コンソールのGUI部品を表現するインターフェース
 */
export interface IConsoleComponent {
  /**
   * 部品を描画する
   */
  draw(): void;

  /**
   * クリックされた時の動作を指定する
   */
  onClick(clickPosX: number, clickPosY: number): void;
}
