import { IConsoleComponent } from '../interface';
import { Speaker } from './speaker';

const BUTTON_WIDTH = 30;
const BUTTON_HEIGHT = 36;
const BUTTON_RADIUS = 10;

export class Button implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;

  private event: () => void;

  private ctx: CanvasRenderingContext2D;
  private speaker: Speaker;

  constructor(ctx: CanvasRenderingContext2D, speaker: Speaker, posX: number, posY: number) {
    this.ctx = ctx;
    this.speaker = speaker;

    this.posX = posX;
    this.posY = posY;
    this.event = () => {};
  }

  draw(): void {
    // ボタンのふち(黒)の描画
    this.ctx.beginPath();
    this.ctx.arc(this.posX + BUTTON_WIDTH / 2, this.posY + BUTTON_HEIGHT / 2, BUTTON_RADIUS + 2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#252525';
    this.ctx.fill();

    // ボタン(白に近い灰色)の描画
    this.ctx.beginPath();
    this.ctx.arc(this.posX + BUTTON_WIDTH / 2, this.posY + BUTTON_HEIGHT / 2, BUTTON_RADIUS, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f8f8f8';
    this.ctx.fill();
  }

  onClick(clickPosX: number, clickPosY: number): void {
    if (this.isButtonClicked(clickPosX, clickPosY)) {
      this.event();
      this.speaker.buzzer();
    }
  }

  setEvent(f: () => void): void {
    this.event = f;
  }

  /**
   * 与えられた座標がボタンの範囲内にあるかどうか
   *
   * @param clickPosX クリックされた場所のx座標
   * @param clickPosY クリックされた場所のy座標
   * @return ボタンが押されていればtrue
   */
  private isButtonClicked(clickPosX: number, clickPosY: number): boolean {
    return (
      this.posX <= clickPosX &&
      clickPosX <= this.posX + BUTTON_WIDTH &&
      this.posY <= clickPosY &&
      clickPosY <= this.posY + BUTTON_HEIGHT
    );
  }
}
