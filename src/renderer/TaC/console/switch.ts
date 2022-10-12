import { IConsoleComponent } from '../interface';

const SWITCH_WIDTH = 30;
const SWITCH_HEIGHT = 36;
const SWITCH_RADIUS = 12;

export class Switch implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;

  private state: boolean;

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number) {
    this.ctx = ctx;

    this.posX = posX;
    this.posY = posY;
    this.state = false;
  }

  draw(): void {
    this.ctx.beginPath();
    this.ctx.arc(
      this.posX + SWITCH_WIDTH / 2,
      this.posY + SWITCH_HEIGHT / 2,
      SWITCH_RADIUS,
      (0 * Math.PI) / 180,
      (360 * Math.PI) / 180,
      false
    );
    this.ctx.fillStyle = '#252525';
    this.ctx.fill();

    this.ctx.beginPath();
    if (this.state === true) {
      /* スイッチがONの時は上 */
      this.ctx.rect(this.posX + SWITCH_WIDTH / 2 - 4, this.posY + SWITCH_HEIGHT / 2 - 4, 8, -22);
      this.ctx.fillStyle = '#f8f8f8';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(this.posX + SWITCH_WIDTH / 2 - 4, this.posY + SWITCH_HEIGHT / 2 - 32, 8, 6);
      this.ctx.fillStyle = '#993300';
      this.ctx.fill();
    } else {
      /* スイッチがOFFの時は下 */
      this.ctx.rect(this.posX + SWITCH_WIDTH / 2 - 4, this.posY + SWITCH_HEIGHT / 2 - 4, 8, 22);
      this.ctx.fillStyle = '#f8f8f8';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(this.posX + SWITCH_WIDTH / 2 - 4, this.posY + SWITCH_HEIGHT / 2 + 18, 8, 6);
      this.ctx.fillStyle = '#993300';
      this.ctx.fill();
    }
  }

  getState() {
    return this.state;
  }

  onClick(clickPosX: number, clickPosY: number): void {
    if (this.isSwitchClicked(clickPosX, clickPosY)) {
      this.state = !this.state;
    }
  }

  private isSwitchClicked(clickPosX: number, clickPosY: number) {
    return (
      this.posX <= clickPosX &&
      clickPosX <= this.posX + SWITCH_WIDTH &&
      this.posY <= clickPosY &&
      clickPosY <= this.posY + SWITCH_HEIGHT
    );
  }
}
