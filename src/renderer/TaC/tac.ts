import { Cpu } from './cpu/cpu';
import { IntrController } from './interrupt/intrController';
import { Psw } from './cpu/psw';
import { Register } from './cpu/register';
import { Memory } from './memory/memory';
import { Mmu } from './memory/mmu';
import { IOHostController } from './io/ioHostController';
import { Timer } from './io/device/timer';
import { TerminalIO } from './io/device/terminalIO';
import { SdHostController } from './io/device/sdHostController';
import { Logger } from './io/device/logger';
import { Console } from './console/console';
import { InstMonitor } from './debug/instMonitor';
import { toHexString } from '../util/lib';
import { querySelector } from '../util/dom.result';

export class Tac {
  private memory: Memory;
  private mmu: Mmu;
  private intrHost: IntrController;
  private cpu: Cpu;
  private psw: Psw;
  private register: Register;
  private ioHost: IOHostController;
  private timer0: Timer;
  private timer1: Timer;
  private terminalIO: TerminalIO;
  private logger: Logger;
  private sdHost: SdHostController;
  private console: Console;

  private cpuEventId: NodeJS.Timeout | null;
  private terminal: HTMLTextAreaElement;
  private breakAddr: number;

  private instMonitor: InstMonitor;

  constructor(canvas: HTMLCanvasElement, terminal: HTMLTextAreaElement) {
    this.memory = new Memory();
    this.intrHost = new IntrController();
    this.psw = new Psw();
    this.register = new Register(this.psw);

    this.mmu = new Mmu(this.memory, this.intrHost, this.psw);
    this.timer0 = new Timer(0, this.intrHost);
    this.timer1 = new Timer(1, this.intrHost);
    this.terminalIO = new TerminalIO(terminal, this.intrHost);

    // シミュレータではBluetoothでのシリアル通信を使用しないので
    // 代わりに開発者ツールのコンソールに出力する
    this.logger = new Logger(this.intrHost);
    this.sdHost = new SdHostController(this.memory, this.intrHost);
    this.console = new Console(canvas, this.memory, this.psw, this.register);

    this.ioHost = new IOHostController(
      this.timer0,
      this.timer1,
      this.terminalIO,
      this.logger,
      this.sdHost,
      this.mmu,
      this.console
    );

    this.cpu = new Cpu(this.mmu, this.register, this.psw, this.psw, this.intrHost, this.ioHost);

    this.cpuEventId = null;
    this.terminal = terminal;
    this.breakAddr = 0;

    this.instMonitor = new InstMonitor(this.psw, this.ioHost);

    this.mmu.loadIpl();

    this.initConsole(canvas);
    this.initButtonEvent();
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
      this.update();
    });

    this.console.update();
  }

  /**
   * ボタンが押された時の動作の初期化
   */
  private initButtonEvent(): void {
    this.console.setRunBtnFunc(() => {
      this.breakAddr = parseInt(
        querySelector<HTMLInputElement>('#break-address').unwrap().value,
        16
      );
      this.console.setRunFlag(true);
      this.run();
    });

    this.console.setResetBtnFunc(() => {
      this.console.setRunFlag(false);
      this.reset();
    });

    this.console.setStopBtnFunc(() => {
      this.console.setRunFlag(false);
      this.stop();
      this.update();
    });
  }

  /**
   * ターミナルの動作の初期化
   */
  private initTerminal(): void {
    this.terminal.onkeydown = (e) => {
      this.terminalIO.inputKeyDown(e);
    };
  }

  /**
   * TaCを実行する
   */
  run(): void {
    const start = new Date();

    // タイマーが一時停止している時は再開する
    this.timer0.restart();
    this.timer1.restart();

    for (;;) {
      const inst = this.cpu.run();

      // 実行した命令を記録する
      this.instMonitor.record(inst);

      if (this.console.getBreakSwitchValue() && this.psw.getPC() === this.breakAddr) {
        // BREAKスイッチがONかつBREAKするアドレスなので, 命令実行後一時停止
        this.update();
        this.stop();
        return;
      }

      if (this.console.getStepSwitchValue()) {
        // STEPスイッチがONなので1命令ずつ実行
        this.update();
        this.stop();
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
   * TaCの動作を停止する
   */
  private stop(): void {
    // STOP中はタイマーを一時停止する
    this.timer0.pause();
    this.timer1.pause();

    if (this.cpuEventId !== null) {
      clearTimeout(this.cpuEventId);
    }
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
    this.intrHost.reset();
    this.timer0.reset();
    this.timer1.reset();
    this.terminalIO.reset();
    this.logger.reset();
    this.sdHost.reset();
    this.mmu.loadIpl();

    this.update();
  }
}
