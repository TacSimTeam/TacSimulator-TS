import { querySelector } from '../../util/dom.result';
import { Instruction } from '../cpu/instruction';
import { Psw } from '../cpu/psw';
import { IOHostController } from '../io/ioHostController';

export class InstMonitor {
  private execCount: number;
  private tlbMissCount: number;
  private monitoring: boolean;

  private psw: Psw;
  private ioHost: IOHostController;
  private inputPID: HTMLInputElement;
  private countElement: HTMLElement;

  constructor(psw: Psw, ioHost: IOHostController) {
    this.execCount = 0;
    this.tlbMissCount = 0;
    this.monitoring = false;
    this.psw = psw;
    this.ioHost = ioHost;
    this.inputPID = querySelector<HTMLInputElement>('#pid-to-monitor').unwrap();
    this.countElement = querySelector('#inst-count').unwrap();
    this.init();
  }

  record(inst: Instruction | undefined): void {
    if (!this.monitoring || this.psw.getPrivFlag()) {
      // 監視中でないorカーネル動作中ならば記録しない
      return;
    }

    if (parseInt(this.inputPID.value) === this.ioHost.getPID()) {
      if (inst === undefined) {
        // Cpu.run()が何も返していないならばTLBMiss
        this.tlbMissCount++;
      } else {
        // ユーザの設定したProcessIDのときにカウントを進める
        this.execCount++;
      }
    }
  }

  private init(): void {
    const btnStart = querySelector<HTMLInputElement>('#btn-start-monitoring').unwrap();

    btnStart.addEventListener('click', () => {
      if (this.monitoring) {
        this.countElement.innerHTML = `${this.execCount} (TLBMiss : ${this.tlbMissCount})`;
        btnStart.innerHTML = 'Monitoring start';
        this.execCount = 0;
        this.tlbMissCount = 0;
      } else {
        btnStart.innerHTML = 'Monitoring stop';
      }

      this.monitoring = !this.monitoring;
    });
  }
}
