import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { Cpu } from './cpu/cpu';
import { IntrController } from './interrupt/intrController';
import { PrivModeSignal } from './cpu/privModeSignal';
import { IOHostController } from './io/ioHostController';
import { Timer } from './io/device/timer';
import { Ft232rl } from './io/device/ft232rl';
import { SdHostController } from './io/device/sdHostController';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private memory: Memory;
  private cpu: Cpu;
  private intrController: IntrController;
  private io: IOHostController;
  private timer0: Timer;
  private timer1: Timer;
  private serialIO: Ft232rl;
  private sd: SdHostController;
  private privModeSignal: PrivModeSignal;

  constructor(ctx: CanvasRenderingContext2D, terminal: HTMLTextAreaElement) {
    this.memory = new Memory();
    this.intrController = new IntrController();
    this.privModeSignal = new PrivModeSignal();

    this.console = new Console(ctx, this.memory);
    this.timer0 = new Timer(0, this.intrController);
    this.timer1 = new Timer(1, this.intrController);
    this.serialIO = new Ft232rl(terminal, this.intrController);
    this.sd = new SdHostController(this.memory, this.intrController);
    this.mmu = new Mmu(this.memory, this.intrController, this.privModeSignal);

    this.io = new IOHostController(this.timer0, this.timer1, this.serialIO, this.sd, this.mmu, this.console);

    this.cpu = new Cpu(this.mmu, this.intrController, this.io, this.privModeSignal);

    this.mmu.loadIpl();
    this.cpu.setPC(0xe000);
    this.console.setRunBtnFunc(() => {
      setInterval(() => {
        this.cpu.run();
      }, 500);
    });

    this.console.drawAll();
  }

  /**
   * クリックされたキャンバス内の座標を受け取り、その座標のボタン・スイッチの処理を行う
   *
   * @param x x座標
   * @param y y座標
   */
  onClick(x: number, y: number) {
    this.console.onClick(x, y);
  }
}
