import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';

export class Tac {
  private console: Console;
  private mmu: Mmu;

  constructor(ctx: CanvasRenderingContext2D) {
    const memory = new Memory();
    this.mmu = new Mmu(memory);
    this.console = new Console(ctx, memory);

    this.console.drawAll();
  }

  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
