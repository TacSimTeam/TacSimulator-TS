import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { Cpu } from './cpu/cpu';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private cpu: Cpu;

  constructor(ctx: CanvasRenderingContext2D) {
    const memory = new Memory();
    this.mmu = new Mmu(memory);
    this.console = new Console(ctx, memory);
    this.cpu = new Cpu(this.mmu);

    this.console.drawAll();
  }

  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
