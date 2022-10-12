import { IConsoleComponent } from '../interface';

const BUTTON_WIDTH = 30;
const BUTTON_HEIGHT = 36;
const BUTTON_RADIUS = 10;

export class Button implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;

  private event: () => void;

  private ctx: CanvasRenderingContext2D;
  private aCtx: AudioContext;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number) {
    this.ctx = ctx;
    this.aCtx = new AudioContext();

    this.posX = posX;
    this.posY = posY;
    this.event = () => {
      return;
    };
  }

  // 30 * 36

  draw(): void {
    this.ctx.beginPath();
    this.ctx.arc(
      this.posX + BUTTON_WIDTH / 2,
      this.posY + BUTTON_HEIGHT / 2,
      BUTTON_RADIUS + 2,
      (0 * Math.PI) / 180,
      (360 * Math.PI) / 180,
      false
    );
    this.ctx.fillStyle = '#252525';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(
      this.posX + BUTTON_WIDTH / 2,
      this.posY + BUTTON_HEIGHT / 2,
      BUTTON_RADIUS,
      (0 * Math.PI) / 180,
      (360 * Math.PI) / 180,
      false
    );
    this.ctx.fillStyle = '#f8f8f8';
    this.ctx.fill();
  }

  onClick(clickPosX: number, clickPosY: number): void {
    if (this.isButtonClicked(clickPosX, clickPosY)) {
      this.event();
      this.soundEffect();
    }
  }

  setEvent(f: () => void) {
    this.event = f;
  }

  private isButtonClicked(clickPosX: number, clickPosY: number) {
    return (
      this.posX <= clickPosX &&
      clickPosX <= this.posX + BUTTON_WIDTH &&
      this.posY <= clickPosY &&
      clickPosY <= this.posY + BUTTON_HEIGHT
    );
  }

  private soundEffect() {
    const oscil = this.aCtx.createOscillator();
    oscil.type = 'square'; /* 矩形波 */
    oscil.frequency.setValueAtTime(670, this.aCtx.currentTime); /* 670Hz */
    oscil.connect(this.aCtx.destination);
    oscil.start();
    oscil.stop(this.aCtx.currentTime + 0.06); /* 0.06sだけ鳴らす */
  }
}
