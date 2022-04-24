export class Button {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  readonly event: () => void;

  constructor(posX: number, posY: number, name: string, event: () => void) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.event = event;
  }
}
