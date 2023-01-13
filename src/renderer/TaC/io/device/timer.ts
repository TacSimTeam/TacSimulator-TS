import { IIOTimer, IIntrSignal } from '../../interface';
import { TIMER0 } from '../../interrupt/interruptKind';

export class Timer implements IIOTimer {
  private count: number; // タイマーのカウント
  private cycle: number; // 周期(ms)
  private timerNum: number; // タイマーの番号(現状TaCは0か1)
  private matchFlag: boolean; // カウンタの値と周期の値が一致したかどうか
  private intrFlag: boolean; // trueであれば処理終了後に割込みを発生させる
  private pauseFlag: boolean; // TaCがSTOP状態になっているか
  private intervalId: NodeJS.Timer | null; // NodeJSのタイマーのID
  private intrSig: IIntrSignal; // 割込み信号

  constructor(timerNum: number, intrSig: IIntrSignal) {
    this.count = 0;
    this.cycle = 0;
    this.timerNum = timerNum;
    this.matchFlag = false;
    this.intrFlag = false;
    this.pauseFlag = false;
    this.intervalId = null;
    this.intrSig = intrSig;
  }

  start(): void {
    this.clear();

    // 1ms毎にroutine()関数を呼ぶ
    // JavaScriptの仕様上, 実際には遅延があり2ms~4ms程になる
    // 令和4年度の卒業研究ではタイマーの正確さは妥協して実装した
    this.intervalId = setInterval(() => {
      this.routine();
    }, 1);
  }

  stop(): void {
    this.clear();
  }

  getCounter(): number {
    return this.count;
  }

  setCycle(cycle: number): void {
    this.cycle = cycle;
  }

  setIntrFlag(flag: boolean): void {
    this.clear();
    this.intrFlag = flag;
  }

  isMatched(): boolean {
    return this.matchFlag;
  }

  private clear(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  private routine(): void {
    if (this.pauseFlag) {
      // もしTaCがSTOP状態(あるいはSTEP実行中)なら
      // カウンタを進めずに終了する
      return;
    }

    if (this.count === this.cycle) {
      // カウンタの値と周期レジスタの値が一致したときは
      // カウンタをリセットし, フラグをtrueにする
      this.count = 0;
      this.matchFlag = true;

      if (this.intrFlag) {
        this.intrSig.interrupt(TIMER0 + this.timerNum);
      }
    } else {
      this.count++;
    }
  }

  // tac.ts側から使用するインタフェース

  /**
   * TaCがSTOP状態になる時に呼び出す
   *
   * ポーズ中はタイマー処理は内部に存在するが
   * カウンタが進まない状態になる(割込みも発生しない)
   */
  pause(): void {
    this.pauseFlag = true;
  }

  /**
   * TaCのSTOP状態が解除される時に呼び出す
   */
  restart(): void {
    this.pauseFlag = false;
  }

  reset(): void {
    this.clear();
    this.count = 0;
    this.cycle = 0;
    this.matchFlag = false;
    this.intrFlag = false;
    this.pauseFlag = false;
  }
}
