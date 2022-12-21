import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { IntrController } from './interrupt/intrController';
import { Cpu } from './cpu/cpu';
import { Psw } from './cpu/psw';
import { Register } from './cpu/register';
import { IOHostController } from './io/ioHostController';
import { Timer } from './io/device/timer';
import { Ft232rl } from './io/device/ft232rl';
import { SdHostController } from './io/device/sdHostController';
import { Console } from './console/console';
import { toHexString } from '../util/lib';
import { querySelector } from '../util/dom.result';

export class Tac {
  private readonly memory: Memory;
  private readonly mmu: Mmu;
  private readonly intrController: IntrController;
  private readonly cpu: Cpu;
  private readonly psw: Psw;
  private readonly register: Register;
  private readonly ioHost: IOHostController;
  private readonly timer0: Timer;
  private readonly timer1: Timer;
  private readonly serialIO: Ft232rl;
  private readonly sdHost: SdHostController;
  private readonly console: Console;

  private cpuEventId: NodeJS.Timeout | null;
  private terminal: HTMLTextAreaElement;
  private breakAddr: number;

  constructor(canvas: HTMLCanvasElement, terminal: HTMLTextAreaElement) {
    this.memory = new Memory();
    this.intrController = new IntrController();
    this.psw = new Psw();
    this.register = new Register(this.psw);

    this.mmu = new Mmu(this.memory, this.intrController, this.psw);
    this.timer0 = new Timer(0, this.intrController);
    this.timer1 = new Timer(1, this.intrController);
    this.serialIO = new Ft232rl(terminal, this.intrController);
    this.sdHost = new SdHostController(this.memory, this.intrController);
    this.console = new Console(canvas, this.memory, this.psw, this.register);

    this.ioHost = new IOHostController(this.timer0, this.timer1, this.serialIO, this.sdHost, this.mmu, this.console);

    this.cpu = new Cpu(this.mmu, this.register, this.psw, this.psw, this.intrController, this.ioHost);

    this.cpuEventId = null;
    this.terminal = terminal;
    this.breakAddr = 0;

    this.mmu.loadIpl();

    this.initConsole(canvas);
    this.initButtons();
    this.initTerminal();

    this.reset();
  }

  /**
   * コンソールの初期化
   *
   * @param canvas コンソールが描画されるCanvas
   */
  private initConsole(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      const x = e.clientX - canvas.getBoundingClientRect().left;
      const y = e.clientY - canvas.getBoundingClientRect().top;

      this.console.onClick(x, y);
    });

    this.console.drawAll();
  }

  /**
   * ボタンが押された時の動作の初期化
   */
  private initButtons(): void {
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
  }

  /**
   * ターミナルの動作の初期化
   */
  private initTerminal(): void {
    this.terminal.onkeydown = (e) => {
      this.serialIO.inputKeyDown(e);
    };
  }

  /**
   * TaCを実行する
   */
  run(): void {
    const start = new Date();
    for (;;) {
      this.cpu.run();

      if (this.console.getBreakSwitchValue() && this.psw.getPC() === this.breakAddr) {
        // BREAKスイッチがONかつBREAKするアドレスなので, 命令実行後一時停止
        this.update();
        return;
      }

      if (this.console.getStepSwitchValue()) {
        // STEPスイッチがONなので1命令ずつ実行
        this.update();
        return;
      }

      const stop = new Date();

      // CPUが10ms動作したら一旦アプリ側に制御を渡す
      if (stop.getTime() - start.getTime() > 10) {
        // setTimeout()でアプリ側の制御が終わったらすぐにCPUを再度動作させるように予約する
        this.cpuEventId = setTimeout(() => {
          this.run();
        }, 0);
        return;
      }
    }
  }

  /**
   * シミュレータの画面を更新する
   */
  private update(): void {
    querySelector('#reg-value-G0').unwrap().innerText = toHexString(this.register.read(0));
    querySelector('#reg-value-G1').unwrap().innerText = toHexString(this.register.read(1));
    querySelector('#reg-value-G2').unwrap().innerText = toHexString(this.register.read(2));
    querySelector('#reg-value-G3').unwrap().innerText = toHexString(this.register.read(3));
    querySelector('#reg-value-G4').unwrap().innerText = toHexString(this.register.read(4));
    querySelector('#reg-value-G5').unwrap().innerText = toHexString(this.register.read(5));
    querySelector('#reg-value-G6').unwrap().innerText = toHexString(this.register.read(6));
    querySelector('#reg-value-G7').unwrap().innerText = toHexString(this.register.read(7));
    querySelector('#reg-value-G8').unwrap().innerText = toHexString(this.register.read(8));
    querySelector('#reg-value-G9').unwrap().innerText = toHexString(this.register.read(9));
    querySelector('#reg-value-G10').unwrap().innerText = toHexString(this.register.read(10));
    querySelector('#reg-value-G11').unwrap().innerText = toHexString(this.register.read(11));
    querySelector('#reg-value-FP').unwrap().innerText = toHexString(this.register.read(12));
    querySelector('#reg-value-SP').unwrap().innerText = toHexString(this.register.read(13));
    querySelector('#reg-value-PC').unwrap().innerText = toHexString(this.psw.getPC());
    querySelector('#reg-value-FLAG').unwrap().innerText = toHexString(this.psw.getFlags());
    querySelector('#reg-value-MD').unwrap().innerText = toHexString(this.console.getMemData());
    querySelector('#reg-value-MA').unwrap().innerText = toHexString(this.console.getMemAddr());
  }

  /**
   * TaCを初期化する
   */
  private reset(): void {
    this.stop();

    this.terminal.value = ''; // ターミナルの文字消去
    this.cpu.reset();
    this.psw.reset();
    this.register.reset();
    this.mmu.reset();
    this.intrController.reset();
    this.timer0.reset();
    this.timer1.reset();
    this.serialIO.reset();
    this.sdHost.reset();
    this.mmu.loadIpl();

    this.update();
  }

  /**
   * TaCの動作を停止する
   */
  private stop(): void {
    if (this.cpuEventId !== null) {
      clearTimeout(this.cpuEventId);
    }
  }
}
