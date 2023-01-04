import { IConsoleComponent } from '../interface';

const LED_RADIUS = 10;

const LED_COLOR_RED_LIGHT = '#ff0000';
const LED_COLOR_RED_DARK = '#400000';
const LED_COLOR_GREEN_LIGHT = '#00ff00';
const LED_COLOR_GREEN_DARK = '#004000';
const LED_COLOR_YELLOW_LIGHT = '#FFFF00';
const LED_COLOR_YELLOW_DARK = '#DAA520';

// LEDは赤, 緑, 黄の3色から選択可能
export type LedColor = 'red' | 'green' | 'yellow';

export class Led implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;

  private state: boolean; // 点灯ならtrue
  private color: LedColor;

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number, type: LedColor) {
    this.ctx = ctx;

    this.posX = posX;
    this.posY = posY;
    this.state = false;
    this.color = type;
  }

  draw(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.posX, this.posY, LED_RADIUS, 0, Math.PI * 2);

    switch (this.color) {
      case 'red':
        this.ctx.fillStyle = this.state ? LED_COLOR_RED_LIGHT : LED_COLOR_RED_DARK;
        break;
      case 'green':
        this.ctx.fillStyle = this.state ? LED_COLOR_GREEN_LIGHT : LED_COLOR_GREEN_DARK;
        break;
      case 'yellow':
        this.ctx.fillStyle = this.state ? LED_COLOR_YELLOW_LIGHT : LED_COLOR_YELLOW_DARK;
        break;
    }

    this.ctx.fill();
  }

  getState(): boolean {
    return this.state;
  }

  setState(state: boolean): void {
    this.state = state;
  }

  onClick(clickPosX: number, clickPosY: number): void {}
}
