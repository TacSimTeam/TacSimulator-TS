import { IIntrHandler, IIntrController } from '../interface/';

export class IntrController implements IIntrController {
  private handler: IIntrHandler;
  private intrFlag: boolean[];

  constructor(handler: IIntrHandler) {
    this.handler = handler;
    this.intrFlag = new Array(16);
  }

  resetFlag() {
    this.intrFlag.fill(false);
  }

  interrupt(intrNum: number): void {
    this.intrFlag[intrNum] = true;
    this.handler.handleInterrupt(intrNum);
    this.intrFlag[intrNum] = false;
  }
}
