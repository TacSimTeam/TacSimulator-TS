import { IConsoleComponent } from '../interface';

const SWITCH_WIDTH = 26;
const SWITCH_HEIGHT = 26;

const SWITCH_TEXT_OFFSET_X = 12;
const SWITCH_TEXT_OFFSET_Y = 50;

export class Switch implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;
  private readonly name: string;

  private state: boolean;

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number, name: string) {
    this.ctx = ctx;

    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.state = false;
  }

  draw(): void {
    this.ctx.clearRect(this.posX - 5, this.posY - 14, 40, 65);
    this.ctx.beginPath();
    this.ctx.rect(this.posX, this.posY, SWITCH_WIDTH, SWITCH_HEIGHT);
    this.ctx.fillStyle = '#777777';
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.posX + 13, this.posY + 13, 10, (0 * Math.PI) / 180, (360 * Math.PI) / 180, false);
    this.ctx.fillStyle = '#000000';
    this.ctx.fill();

    this.ctx.beginPath();
    if (this.state === true) {
      /* スイッチがONの時は上 */
      this.ctx.rect(this.posX + 9, this.posY + 12, 8, -20);
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(this.posX + 9, this.posY - 12, 8, 8);
      this.ctx.fillStyle = '#993300';
      this.ctx.fill();
    } else {
      /* スイッチがONの時は下 */
      this.ctx.rect(this.posX + 9, this.posY + 12, 8, 20);
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(this.posX + 9, this.posY + 30, 8, 8);
      this.ctx.fillStyle = '#993300';
      this.ctx.fill();
    }

    this.ctx.beginPath();
    this.ctx.fillStyle = '#000080';
    this.ctx.font = '10px serif';
    this.ctx.fillText(this.name, this.posX + SWITCH_TEXT_OFFSET_X, this.posY + SWITCH_TEXT_OFFSET_Y);
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
