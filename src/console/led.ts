export class Led {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  readonly onColor: string;
  readonly offColor: string;
  private state: boolean;

  constructor(posX: number, posY: number, name: string, onColor: string, offColor: string) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.onColor = onColor;
    this.offColor = offColor;
    this.state = false;
  }
}
