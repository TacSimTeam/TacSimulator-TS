import { IIOTimer, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptKind';

export class Timer implements IIOTimer {
  /* カウンタ */
  private count: number;

  /* 周期(1ms) */
  private cycle: number;

  /* このタイマーの番号(現状TaCは0か1) */
  private timerNum: 0 | 1;

  /* カウンタの値と周期の値が一致したかどうか */
  private matchFlag: boolean;

  /* trueであれば処理終了後に割り込みを発生させる */
  private intrFlag: boolean;

  /* NodeJSのタイマーのID */
  private intervalId: NodeJS.Timer | null;

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

  setIntrFlag(flag: boolean): void {
    this.clear();
    this.intrFlag = flag;
  }

  start(): void {
    this.clear();

    /* 1ms毎にroutine()関数を呼ぶ */
    this.intervalId = setInterval(() => {
      this.routine();
    }, 1);
  }

  stop(): void {
    this.clear();
  }

  reset() {
    this.clear();
    this.count = 0;
    this.cycle = 0;
    this.matchFlag = false;
    this.intrFlag = false;
  }

  clear(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private routine(): void {
    if (this.count === this.cycle) {
      /**
       * カウンタの値と周期レジスタの値が一致したときは
       * フラグをtrueにして、カウンタをリセットする
       */
      this.matchFlag = true;
      this.count = 0;

      if (this.intrFlag) {
        this.intrSignal.interrupt(intr.TIMER0 + this.timerNum);
      }
    } else {
      this.count++;
    }
  }
}
