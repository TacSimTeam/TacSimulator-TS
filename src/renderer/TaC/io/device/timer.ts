import { IIOTimer, IIntrSignal } from '../../interface';
import { TIMER0 } from '../../interrupt/interruptKind';

export class Timer implements IIOTimer {
  private count: number; // タイマーのカウント
  private cycle: number; // 周期(ms)
  private timerNum: number; // タイマーの番号(現状TaCは0か1)
  private matchFlag: boolean; // カウンタの値と周期の値が一致したかどうか
  private intrFlag: boolean; // trueであれば処理終了後に割込みを発生させる
  private intervalId: NodeJS.Timer | null; // NodeJSのタイマーのID
  private intrSignal: IIntrSignal; // 割込み信号

  constructor(timerNum: number, intrSignal: IIntrSignal) {
    this.count = 0;
    this.cycle = 0;
    this.timerNum = timerNum;
    this.matchFlag = false;
    this.intrFlag = false;
    this.intervalId = null;
    this.intrSignal = intrSignal;
  }

  getCounter(): number {
    return this.count;
  }

  isMatched(): boolean {
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

    // 1ms毎にroutine()関数を呼ぶ
    // JavaScriptの仕様上, 実際には遅延があり2ms~4ms程になる
    // 2022-12-23時点ではタイマーの正確さは妥協して実装した
    this.intervalId = setInterval(() => {
      this.routine();
    }, 1);
  }

  stop(): void {
    this.clear();
  }

  reset(): void {
    this.clear();
    this.count = 0;
    this.cycle = 0;
    this.matchFlag = false;
    this.intrFlag = false;
  }

  clear(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  private routine(): void {
    if (this.count === this.cycle) {
      // カウンタの値と周期レジスタの値が一致したときは
      // カウンタをリセットし, フラグをtrueにする
      this.count = 0;
      this.matchFlag = true;

      if (this.intrFlag) {
        this.intrSignal.interrupt(TIMER0 + this.timerNum);
      }
    } else {
      this.count++;
    }
  }
}
