import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { Cpu } from './cpu/cpu';
import { IntrController } from './interrupt/intrController';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private cpu: Cpu;
  private intrController: IntrController;

  constructor(ctx: CanvasRenderingContext2D) {
    const memory = new Memory();
    this.console = new Console(ctx, memory);
    this.intrController = new IntrController();
    this.mmu = new Mmu(memory, this.intrController);
    this.cpu = new Cpu(this.mmu, this.intrController);

    this.console.drawAll();
  }

  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
