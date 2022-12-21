import { Console } from './console/console';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { Cpu } from './cpu/cpu';
import { Register } from './cpu/register';
import { Psw } from './cpu/psw';
import { IntrController } from './interrupt/intrController';
import { IOHostController } from './io/ioHostController';
import { Timer } from './io/device/timer';
import { Ft232rl } from './io/device/ft232rl';
import { SdHostController } from './io/device/sdHostController';
import { querySelector } from '../util/dom.result';
import { toHexString } from '../utils';

export class Tac {
  private console: Console;
  private mmu: Mmu;
  private memory: Memory;
  private register: Register;
  private psw: Psw;
  private cpu: Cpu;
  private intrController: IntrController;
  private io: IOHostController;
  private timer0: Timer;
  private timer1: Timer;
  private serialIO: Ft232rl;
  private sd: SdHostController;

  private cpuEventId: NodeJS.Timeout | null;

  private terminal: HTMLTextAreaElement;

  private breakAddr: number;

  constructor(canvas: HTMLCanvasElement, terminal: HTMLTextAreaElement) {
    this.memory = new Memory();
    this.intrController = new IntrController();

    this.psw = new Psw();
    this.register = new Register(this.psw);

    this.console = new Console(canvas, this.memory, this.psw, this.register);
    this.timer0 = new Timer(0, this.intrController);
    this.timer1 = new Timer(1, this.intrController);
    this.serialIO = new Ft232rl(terminal, this.intrController);
    this.sd = new SdHostController(this.memory, this.intrController);
    this.mmu = new Mmu(this.memory, this.intrController, this.psw);

    this.io = new IOHostController(this.timer0, this.timer1, this.serialIO, this.sd, this.mmu, this.console);

    this.cpu = new Cpu(this.mmu, this.register, this.psw, this.psw, this.intrController, this.io);

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

    this.console.drawAll();
    this.reset();
  }

  /**
   * クリックされたキャンバス内の座標を受け取り、その座標のボタン・スイッチの処理を行う
   *
   * @param x x座標
   * @param y y座標
   */
  onClick(x: number, y: number): void {
    this.console.onClick(x, y);
  }

  run(): void {
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
    querySelector('#reg-value-MD').unwrap().innerText = toHexString(this.console['memData']);
    querySelector('#reg-value-MA').unwrap().innerText = toHexString(this.console['memAddr']);
  }

  private reset(): void {
    this.stop();

    /* ターミナルの文字消去 */
    this.terminal.value = '';

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

  private stop(): void {
    console.log(this.memory);
    if (this.cpuEventId !== null) {
      clearTimeout(this.cpuEventId);
    }
  }

  private test(): void {
    this.mmu.loadIpl();
    this.psw.jumpTo(0xe000);

    const start = new Date();
    for (let i = 0; i < 10000; i++) {
      this.cpu.run();
    }
    const stop = new Date();

    console.log(`${stop.getTime() - start.getTime()}ms`);
  }
}
