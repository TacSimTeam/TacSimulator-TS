import { IConsoleComponent } from '../interface';

const BUTTON_WIDTH = 26;
const BUTTON_HEIGHT = 26;
const BUTTON_RADIUS = 8;

const BUTTON_TEXT_OFFSET_X = 12;
const BUTTON_TEXT_OFFSET_Y = 38;

export class Button implements IConsoleComponent {
  private readonly posX: number;
  private readonly posY: number;
  private readonly name: string;

  private event: () => void;

  private ctx: CanvasRenderingContext2D;
  private aCtx: AudioContext;

  constructor(ctx: CanvasRenderingContext2D, posX: number, posY: number, name: string) {
    this.ctx = ctx;
    this.aCtx = new AudioContext();

    this.posX = posX;
    this.posY = posY;
    this.name = name;
    this.event = () => {
      return;
    };
  }

  draw(): void {
    this.ctx.beginPath();
    this.ctx.rect(this.posX, this.posY, BUTTON_WIDTH, BUTTON_HEIGHT);
    this.ctx.fillStyle = '#777777';
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
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fill();
    this.ctx.fillStyle = '#000080';
    this.ctx.font = '10px serif';
    this.ctx.fillText(this.name, this.posX + BUTTON_TEXT_OFFSET_X, this.posY + BUTTON_TEXT_OFFSET_Y);
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
