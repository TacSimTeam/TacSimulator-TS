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
    (document.getElementById('reg-value-G0') as HTMLElement).innerText = '0x' + this.register.read(0).toString(16);
    (document.getElementById('reg-value-G1') as HTMLElement).innerText = '0x' + this.register.read(1).toString(16);
    (document.getElementById('reg-value-G2') as HTMLElement).innerText = '0x' + this.register.read(2).toString(16);
    (document.getElementById('reg-value-G3') as HTMLElement).innerText = '0x' + this.register.read(3).toString(16);
    (document.getElementById('reg-value-G4') as HTMLElement).innerText = '0x' + this.register.read(4).toString(16);
    (document.getElementById('reg-value-G5') as HTMLElement).innerText = '0x' + this.register.read(5).toString(16);
    (document.getElementById('reg-value-G6') as HTMLElement).innerText = '0x' + this.register.read(6).toString(16);
    (document.getElementById('reg-value-G7') as HTMLElement).innerText = '0x' + this.register.read(7).toString(16);
    (document.getElementById('reg-value-G8') as HTMLElement).innerText = '0x' + this.register.read(8).toString(16);
    (document.getElementById('reg-value-G9') as HTMLElement).innerText = '0x' + this.register.read(9).toString(16);
    (document.getElementById('reg-value-G10') as HTMLElement).innerText = '0x' + this.register.read(10).toString(16);
    (document.getElementById('reg-value-G11') as HTMLElement).innerText = '0x' + this.register.read(11).toString(16);
    (document.getElementById('reg-value-FP') as HTMLElement).innerText = '0x' + this.register.read(12).toString(16);
    (document.getElementById('reg-value-SP') as HTMLElement).innerText = '0x' + this.register.read(13).toString(16);
    (document.getElementById('reg-value-PC') as HTMLElement).innerText = '0x' + this.psw.getPC().toString(16);
    (document.getElementById('reg-value-FLAG') as HTMLElement).innerText = '0x' + this.psw.getFlags().toString(16);
    (document.getElementById('reg-value-MD') as HTMLElement).innerText = '0x' + this.console['memData'].toString(16);
    (document.getElementById('reg-value-MA') as HTMLElement).innerText = '0x' + this.console['memAddr'].toString(16);
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
