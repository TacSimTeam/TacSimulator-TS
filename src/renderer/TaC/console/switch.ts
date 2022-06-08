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

  /* 押されていたら状態(ON/OFF)を切り替える */
  onClick(mouseX: number, mouseY: number) {
    if (this.posX <= mouseX && mouseX <= this.posX + 26 && this.posY <= mouseY && mouseY <= this.posY + 26) {
      // 反転
      this.state = !this.state;
    }
  }

  getState() {
    return this.state;
  }
}
