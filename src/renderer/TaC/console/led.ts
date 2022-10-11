import { IConsoleComponent } from '../interface';

const LED_COLOR_RED_LIGHT = '#ff0000';
const LED_COLOR_RED_DARK = '#400000';
const LED_COLOR_GREEN_LIGHT = '#00ff00';
const LED_COLOR_GREEN_DARK = '#004000';
const LED_COLOR_YELLOW_LIGHT = '#FFFF00';
const LED_COLOR_YELLOW_DARK = '#DAA520';

export type LedType = 'red' | 'green' | 'yellow';

export class Led implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;
  private readonly name: string;

  private state: boolean;
  private type: LedType;

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number, name: string, type: LedType) {
    this.ctx = ctx;

    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.state = false;
    this.type = type;
  }

  draw(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.posX, this.posY, 10, 0, Math.PI * 2, false);

    switch (this.type) {
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

  getState() {
    return this.state;
  }

  setState(state: boolean) {
    this.state = state;
  }

  onClick(clickPosX: number, clickPosY: number): void {
    return;
  }
}
