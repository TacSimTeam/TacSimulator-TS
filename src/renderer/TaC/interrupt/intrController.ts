import { IIntrController } from '../interface';
import * as intr from './interruptKind';

export class IntrController implements IIntrController {
  private intrFlags: boolean[]; // 割込みフラグをまとめた配列

  constructor() {
    this.intrFlags = new Array(16);
    this.reset();
  }

  interrupt(intrNum: number): void {
    this.intrFlags[intrNum] = true;
  }

  checkIntrNum(): number | null {
    for (let i = intr.EXCP_TLB_MISS; i <= intr.EXCP_SVC; i++) {
      // 例外の方が優先度高いので先に見る
      if (this.intrFlags[i]) {
        // 確認した割込みはfalseに戻す
        this.intrFlags[i] = false;
        return i;
      }
    }

    for (let i = intr.TIMER0; i <= intr.PIO; i++) {
      if (this.intrFlags[i]) {
        this.intrFlags[i] = false;
        return i;
      }
    }

    // 割込みが発生していないときはnullを返す
    return null;
  }

  isExceptionOccurred(): boolean {
    for (let i = intr.EXCP_TLB_MISS; i <= intr.EXCP_SVC; i++) {
      if (this.intrFlags[i]) {
        return true;
      }
    }
    return false;
  }

  reset(): void {
    this.intrFlags.fill(false);
  }
}
