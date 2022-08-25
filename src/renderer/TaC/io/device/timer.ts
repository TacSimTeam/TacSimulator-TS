import { IIOTimer, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

export class Timer implements IIOTimer {
  /* カウンタ */
  private count: number;

  /* 周期(1ms) */
  private cycle: number;

  /* このタイマーの番号(現状TaCは0か1) */
  private timerNum: 0 | 1;

  /* NodeJSのタイマーのID */
  private intervalId: NodeJS.Timer | null;

  /* カウンタの値と周期の値が一致したかどうか */
  private matchFlag: boolean;

  /* 割込みが許可されているか */
  private intrFlag: boolean;

  /* 割込み信号 */
  private intrSignal: IIntrSignal;

  constructor(timerNum: 0 | 1, intrSignal: IIntrSignal) {
    this.count = 0;
    this.cycle = 0;
    this.timerNum = timerNum;
    this.intervalId = null;
    this.matchFlag = false;
    this.intrFlag = false;
    this.intrSignal = intrSignal;
  }

  getCounter(): number {
    return this.count;
  }

  getMatchFlag(): boolean {
    return this.matchFlag;
  }

  setCycle(cycle: number): void {
    this.cycle = cycle;
  }

  setInterruptFlag(flag: boolean): void {
    this.reset();
    this.intrFlag = flag;
  }

  start(): void {
    this.reset();

    /* 1ms毎にroutine()関数を呼ぶ */
    this.intervalId = setInterval(() => {
      this.routine();
    }, 1);
  }

  stop(): void {
    this.reset();
  }

  reset(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private routine(): void {
    if (this.count === this.cycle) {
      /**
       * カウンタの値と周期レジスタの値が一致したときは
       * フラグをtrueにし、カウンタをリセットする
       *
       * 割込み許可があるなら割込みを発生させる
       */
      this.matchFlag = true;
      this.count = 0;

      if (this.intrFlag) {
        if (this.timerNum == 0) {
          this.intrSignal.interrupt(intr.TIMER0);
        } else {
          this.intrSignal.interrupt(intr.TIMER1);
        }
      }
    } else {
      this.count++;
    }
  }
}
