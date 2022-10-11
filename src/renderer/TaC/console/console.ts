import { IConsoleComponent, IDmaSignal, IIOConsole } from '../interface';

export class Console implements IIOConsole {
  private ctx: CanvasRenderingContext2D;
  private aCtx: AudioContext;

  private readonly width: number;
  private readonly height: number;

  /* コンソールはDMA方式でメモリとアクセスできる */
  private memory: IDmaSignal;

  private components: [...IConsoleComponent[]];

  constructor(canvas: HTMLCanvasElement, memory: IDmaSignal) {
    const ctx = canvas.getContext('2d');
    if (ctx !== null) {
      this.ctx = ctx;
    } else {
      throw new Error('Error: Failure getContext()');
    }
    this.aCtx = new AudioContext();

    this.width = canvas.width;
    this.height = canvas.height;

    this.memory = memory;
    this.components = [];
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawAll() {
    this.clear();
    this.components.forEach((element) => {
      element.draw();
    });
  }

  onClick(posX: number, posY: number) {
    this.components.forEach((element) => {
      element.onClick(posX, posY);
    });
    this.drawAll();
  }

  getDataSwitchValue(): number {
    return 0;
  }

  getMemAddrLEDValue(): number {
    return 0;
  }

  getRotSwitchValue(): number {
    return 0;
  }

  getFuncSwitchValue(): number {
    return 0;
  }

  setLEDValue(val: number): void {
    return;
  }
}
