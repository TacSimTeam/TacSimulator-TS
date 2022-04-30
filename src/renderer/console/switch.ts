export class Switch {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  private state: boolean;

  constructor(posX: number, posY: number, name: string) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.state = false;
  }

  getState() {
    return this.state;
  }
}
