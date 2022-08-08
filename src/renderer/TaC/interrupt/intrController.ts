import { IIntrController } from '../interface/';
import * as intr from './interruptNum';

export class IntrController implements IIntrController {
  private intrFlags: boolean[];

  constructor() {
    this.intrFlags = new Array(16);
  }

  interrupt(intrNum: number): void {
    this.intrFlags[intrNum] = true;
  }

  checkIntrNum(): number {
    for (let i = intr.EXCP_TLB_MISS; i <= intr.EXCP_SVC; i++) {
      if (this.intrFlags[i]) {
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
    return -1;
  }

  isOccurredException(): boolean {
    for (let i = intr.EXCP_TLB_MISS; i <= intr.EXCP_SVC; i++) {
      if (this.intrFlags[i]) {
        return true;
      }
    }
    return false;
  }
}
