import { IConsoleComponent } from '../interface';

// BASE : スイッチの土台の黒い丸
// HEAD : スイッチの頭の赤い箇所
// BODY : スイッチの本体(赤い箇所は除く)

const SWITCH_BASE_WIDTH = 30;
const SWITCH_BASE_HEIGHT = 36;
const SWITCH_BASE_RADIUS = 12;
const SWITCH_BODY_WIDTH = 8;
const SWITCH_BODY_HEIGHT = 22;
const SWITCH_HEAD_HEIGHT = 6;

const SWITCH_BASE_COLOR = '#252525';
const SWITCH_HEAD_COLOR = '#993300';
const SWITCH_BODY_COLOR = '#f8f8f8';

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
      this.posX + SWITCH_BASE_WIDTH / 2,
      this.posY + SWITCH_BASE_HEIGHT / 2,
      SWITCH_BASE_RADIUS,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = SWITCH_BASE_COLOR;
    this.ctx.fill();

    this.ctx.beginPath();
    if (this.state) {
      // スイッチがONの時は上
      this.ctx.rect(
        this.posX + SWITCH_BASE_WIDTH / 2 - SWITCH_BODY_WIDTH / 2,
        this.posY + SWITCH_BASE_HEIGHT / 2 - SWITCH_BODY_WIDTH / 2,
        SWITCH_BODY_WIDTH,
        -SWITCH_BODY_HEIGHT
      );
      this.ctx.fillStyle = SWITCH_BODY_COLOR;
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(
        this.posX + SWITCH_BASE_WIDTH / 2 - SWITCH_BODY_WIDTH / 2,
        this.posY +
          SWITCH_BASE_HEIGHT / 2 -
          SWITCH_BODY_WIDTH / 2 -
          SWITCH_BODY_HEIGHT -
          SWITCH_HEAD_HEIGHT,
        SWITCH_BODY_WIDTH,
        SWITCH_HEAD_HEIGHT
      );
      this.ctx.fillStyle = SWITCH_HEAD_COLOR;
      this.ctx.fill();
    } else {
      // スイッチがOFFの時は下
      this.ctx.rect(
        this.posX + SWITCH_BASE_WIDTH / 2 - SWITCH_BODY_WIDTH / 2,
        this.posY + SWITCH_BASE_HEIGHT / 2 - SWITCH_BODY_WIDTH / 2,
        SWITCH_BODY_WIDTH,
        SWITCH_BODY_HEIGHT
      );
      this.ctx.fillStyle = SWITCH_BODY_COLOR;
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.rect(
        this.posX + SWITCH_BASE_WIDTH / 2 - SWITCH_BODY_WIDTH / 2,
        this.posY + SWITCH_BASE_HEIGHT / 2 - SWITCH_BODY_WIDTH / 2 + SWITCH_BODY_HEIGHT,
        SWITCH_BODY_WIDTH,
        SWITCH_HEAD_HEIGHT
      );
      this.ctx.fillStyle = SWITCH_HEAD_COLOR;
      this.ctx.fill();
    }
  }

  getState(): boolean {
    return this.state;
  }

  onClick(clickPosX: number, clickPosY: number): void {
    if (this.isSwitchClicked(clickPosX, clickPosY)) {
      this.state = !this.state;
    }
  }

  private isSwitchClicked(clickPosX: number, clickPosY: number): boolean {
    return (
      this.posX <= clickPosX &&
      clickPosX <= this.posX + SWITCH_BASE_WIDTH &&
      this.posY <= clickPosY &&
      clickPosY <= this.posY + SWITCH_BASE_HEIGHT
    );
  }
}
