export class Led {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  readonly onColor: string;
  readonly offColor: string;

  /* trueなら点灯, falseなら消灯 */
  private state: boolean;

  constructor(posX: number, posY: number, name: string, onColor: string, offColor: string) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.onColor = onColor;
    this.offColor = offColor;
    this.state = false;
  }

  getState() {
    return this.state;
  }

  setState(state: boolean) {
    this.state = state;
  }
}
