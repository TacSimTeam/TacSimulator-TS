import { Console } from './console/console';

export class Tac {
  private console: Console;

  constructor(ctx: CanvasRenderingContext2D) {
    this.console = new Console(ctx);
    this.console.drawAll();
  }

  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
