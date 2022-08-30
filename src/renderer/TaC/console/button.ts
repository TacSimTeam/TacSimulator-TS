export class Button {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  event: () => void;

  constructor(posX: number, posY: number, name: string, event: () => void) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.event = event;
  }

  /* 押されていたら指定した関数を実行する */
  onClick(mouseX: number, mouseY: number) {
    if (this.posX <= mouseX && mouseX <= this.posX + 26 && this.posY <= mouseY && mouseY <= this.posY + 26) {
      this.event();
    }
  }
}
