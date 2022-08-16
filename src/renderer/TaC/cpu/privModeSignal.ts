import { IPrivModeSignal } from '../interface';

export class PrivModeSignal implements IPrivModeSignal {
  private flag: boolean;

  constructor() {
    this.flag = false;
  }

  getPrivMode(): boolean {
    return this.flag;
  }

  setPrivMode(flag: boolean): void {
    this.flag = flag;
  }
}
