export class Button {
  readonly posX: number;
  readonly posY: number;
  readonly name: string;
  event: () => void;

  private audioCtx: AudioContext;

  constructor(posX: number, posY: number, name: string, event: () => void) {
    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.event = event;
    this.audioCtx = new AudioContext();
  }

  /* 押されていたら指定した関数を実行する */
  onClick(mouseX: number, mouseY: number) {
    if (this.posX <= mouseX && mouseX <= this.posX + 26 && this.posY <= mouseY && mouseY <= this.posY + 26) {
      this.event();

      const oscil = this.audioCtx.createOscillator();
      oscil.type = 'square';
      oscil.frequency.setValueAtTime(670, this.audioCtx.currentTime); // 値をヘルツで指定
      oscil.connect(this.audioCtx.destination);
      oscil.start();
      oscil.stop(this.audioCtx.currentTime + 0.06);
    }
  }
}
