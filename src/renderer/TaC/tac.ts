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
import { Register } from './cpu/register';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private memory: Memory;
  private register: Register;
  private cpu: Cpu;
  private intrController: IntrController;
  private io: IOHostController;
  private timer0: Timer;
  private timer1: Timer;
  private serialIO: Ft232rl;
  private sd: SdHostController;
  private privModeSignal: PrivModeSignal;

  private cpuEventId: NodeJS.Timeout | null;

  private terminal: HTMLTextAreaElement;

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

    this.register = new Register(this.privModeSignal);
    this.cpu = new Cpu(this.register, this.mmu, this.intrController, this.io, this.privModeSignal);

    this.cpuEventId = null;
    this.terminal = terminal;

    this.mmu.loadIpl();
    this.cpu.setPC(0xe000);

    this.console.setRunBtnFunc(() => {
      this.run();
    });
    this.console.setResetBtnFunc(() => {
      this.reset();
    });
    this.console.setStopBtnFunc(() => {
      this.stop();
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

  run() {
    const start = new Date();
    for (;;) {
      this.cpu.run();
      const stop = new Date();
      /* CPUが10ms動作したら一旦アプリ側に制御を渡す */
      if (stop.getTime() - start.getTime() > 10) {
        /* setTimeout()でアプリ側の制御が終わったらすぐにCPUを再度動作させるように予約する */
        this.cpuEventId = setTimeout(() => {
          this.run();
        }, 0);
        return;
      }
    }
  }

  reset() {
    this.stop();

    /* ターミナルの文字消去 */
    this.terminal.value = '';

    this.cpu.reset();
    this.register.reset();
    this.mmu.reset();
    this.intrController.reset();
    this.timer0.reset();
    this.timer1.reset();
    this.serialIO.reset();
    this.sd.reset();

    this.mmu.loadIpl();
    this.cpu.setPC(0xe000);
  }

  stop() {
    if (this.cpuEventId !== null) {
      clearTimeout(this.cpuEventId);
    }
  }

  test() {
    this.mmu.loadIpl();
    this.cpu.setPC(0xe000);

    const start = new Date();
    for (let i = 0; i < 10000; i++) {
      this.cpu.run();
    }
    const stop = new Date();

    console.log(`${stop.getTime() - start.getTime()}ms`);
  }
}
