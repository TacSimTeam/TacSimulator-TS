import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { Cpu } from './cpu/cpu';
import { Register } from './cpu/register';
import { Alu } from './cpu/alu';
import { Psw } from './cpu/psw';
import { PrivModeSignal } from './cpu/privModeSignal';
import { IntrController } from './interrupt/intrController';
import { IOHostController } from './io/ioHostController';
import { Timer } from './io/device/timer';
import { Ft232rl } from './io/device/ft232rl';
import { SdHostController } from './io/device/sdHostController';
import { regNumToString } from './debug/instruction';
import { assertIsDefined } from '../utils';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private memory: Memory;
  private register: Register;
  private psw: Psw;
  private alu: Alu;
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

  private breakAddr: number;

  constructor(canvas: HTMLCanvasElement, terminal: HTMLTextAreaElement) {
    this.memory = new Memory();
    this.intrController = new IntrController();
    this.privModeSignal = new PrivModeSignal();

    this.register = new Register(this.privModeSignal);
    this.psw = new Psw(this.privModeSignal);

    this.console = new Console(canvas, this.memory, this.psw, this.register);
    this.timer0 = new Timer(0, this.intrController);
    this.timer1 = new Timer(1, this.intrController);
    this.serialIO = new Ft232rl(terminal, this.intrController);
    this.sd = new SdHostController(this.memory, this.intrController);
    this.mmu = new Mmu(this.memory, this.intrController, this.privModeSignal);

    this.io = new IOHostController(this.timer0, this.timer1, this.serialIO, this.sd, this.mmu, this.console);

    this.alu = new Alu(this.intrController);
    this.cpu = new Cpu(this.mmu, this.psw, this.register, this.alu, this.intrController, this.io);

    this.cpuEventId = null;
    this.terminal = terminal;
    this.breakAddr = 0;

    this.mmu.loadIpl();

    this.console.setRunBtnFunc(() => {
      this.breakAddr = parseInt((document.getElementById('break-address') as HTMLInputElement).value, 16);
      this.console.setRunLED(true);
      this.run();
    });
    this.console.setResetBtnFunc(() => {
      this.console.setRunLED(false);
      this.reset();
    });
    this.console.setStopBtnFunc(() => {
      this.console.setRunLED(false);
      this.stop();
      this.update();
    });

    this.terminal.onkeydown = (e) => {
      this.serialIO.inputKeyDown(e);
    };

    this.terminal.onkeyup = (e) => {
      this.serialIO.inputKeyUp(e);
    };

    this.console.drawAll();
    this.reset();
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
      if (this.console.getBreakSwitchValue() && this.psw.getPC() === this.breakAddr) {
        /* BREAKスイッチがONなので1命令実行後一時停止 */
        this.cpu.run();
        this.update();
        return;
      }

      this.cpu.run();
      if (this.console.getStepSwitchValue()) {
        /* STEPスイッチがONなので1命令ずつ実行 */
        this.update();
        return;
      }

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

  update() {
    assertIsDefined(document.getElementById('value-pc'));
    const pc_value = document.getElementById('value-pc') as HTMLElement;
    pc_value.textContent = `PC : ${this.psw.getPC().toString(16)}`;

    assertIsDefined(document.getElementById('reg-list'));
    const reg_list = document.getElementById('reg-list') as HTMLUListElement;

    for (let i = 0; i <= 15; i++) {
      const reg_text = reg_list.children[i];
      if (reg_text !== null) {
        const decimal = this.cpu.readReg(i).toString(10);
        const hex = this.cpu.readReg(i).toString(16);
        const text = `${regNumToString(i)} : 0x${hex} (${decimal})`;

        reg_text.textContent = text;
      }
    }
  }

  reset() {
    this.stop();

    /* ターミナルの文字消去 */
    this.terminal.value = ' ';

    this.cpu.reset();
    this.psw.reset();
    this.register.reset();
    this.mmu.reset();
    this.intrController.reset();
    this.timer0.reset();
    this.timer1.reset();
    this.serialIO.reset();
    this.sd.reset();

    this.mmu.loadIpl();

    this.update();
  }

  stop() {
    console.log(this.memory);
    if (this.cpuEventId !== null) {
      clearTimeout(this.cpuEventId);
    }
  }

  test() {
    this.mmu.loadIpl();
    this.psw.setPC(0xe000);

    const start = new Date();
    for (let i = 0; i < 10000; i++) {
      this.cpu.run();
    }
    const stop = new Date();

    console.log(`${stop.getTime() - start.getTime()}ms`);
  }
}
