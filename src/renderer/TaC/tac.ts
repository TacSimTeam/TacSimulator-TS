import { Console } from './console/console';
import { Mmu } from './memory/mmu';

export class Tac {
  private console: Console;
  private mmu: Mmu;

  constructor(ctx: CanvasRenderingContext2D) {
    this.console = new Console(ctx);
    this.mmu = new Mmu();

    this.console.drawAll();
  }

  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
