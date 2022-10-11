import { Button } from './button';
import { Switch } from './switch';
import { Led } from './led';

import { IConsoleComponent, IDmaSignal, IIOConsole } from '../interface';

export class Console implements IIOConsole {
  private ctx: CanvasRenderingContext2D;
  private aCtx: AudioContext;

  private readonly width: number;
  private readonly height: number;

  /* コンソールはDMA方式でメモリとアクセスできる */
  private memory: IDmaSignal;

  private components: [...IConsoleComponent[]];

  private addrLeds: Array<Led>;
  private dataLeds: Array<Led>;
  private flagLeds: Array<Led>;
  private registerLeds: Array<Led>;
  private runLed: Led;

  private dataSws: Array<Switch>;
  private breakSw: Switch;
  private stepSw: Switch;

  private leftArrowBtn: Button;
  private rightArrowBtn: Button;

  private resetBtn: Button;
  private runBtn: Button;
  private stopBtn: Button;
  private setaBtn: Button;
  private incaBtn: Button;
  private decaBtn: Button;
  private writeBtn: Button;

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

    /* コンソール部品の初期化 */
    this.addrLeds = new Array(8);
    for (let i = 0; i < 8; i++) {
      this.addrLeds[i] = new Led(this.ctx, 370 - i * 40, 30, 'A' + i, 'red');
    }

    this.dataLeds = new Array(8);
    for (let i = 0; i < 8; i++) {
      this.dataLeds[i] = new Led(this.ctx, 370 - i * 40, 90, 'D' + i, 'green');
    }

    this.flagLeds = new Array(3);
    this.flagLeds[0] = new Led(ctx, 350, 160, 'C', 'yellow');
    this.flagLeds[1] = new Led(ctx, 380, 160, 'S', 'yellow');
    this.flagLeds[2] = new Led(ctx, 410, 160, 'Z', 'yellow');

    this.registerLeds = new Array(6);
    this.registerLeds[0] = new Led(ctx, 105, 160, 'G0', 'yellow');
    this.registerLeds[1] = new Led(ctx, 139, 160, 'G1', 'yellow');
    this.registerLeds[2] = new Led(ctx, 173, 160, 'G2', 'yellow');
    this.registerLeds[3] = new Led(ctx, 207, 160, 'SP', 'yellow');
    this.registerLeds[4] = new Led(ctx, 241, 160, 'PC', 'yellow');
    this.registerLeds[5] = new Led(ctx, 275, 160, 'MM', 'yellow');

    this.runLed = new Led(ctx, 400, 60, 'RUN', 'red');

    this.dataSws = new Array(8);
    for (let i = 0; i < 8; i++) {
      this.dataSws[i] = new Switch(this.ctx, 370 - i * 40, 250, 'D' + i);
    }

    this.stepSw = new Switch(this.ctx, 100, 330, 'STEP');
    this.breakSw = new Switch(this.ctx, 60, 330, 'BREAK');

    this.leftArrowBtn = new Button(this.ctx, 60, 150, '<-');
    this.rightArrowBtn = new Button(this.ctx, 295, 150, '->');
    this.resetBtn = new Button(this.ctx, 20, 330, 'RESET');
    this.runBtn = new Button(this.ctx, 140, 330, 'RUN');
    this.stopBtn = new Button(this.ctx, 180, 330, 'STOP');
    this.setaBtn = new Button(this.ctx, 240, 330, 'SETA');
    this.incaBtn = new Button(this.ctx, 280, 330, 'INCA');
    this.decaBtn = new Button(this.ctx, 320, 330, 'DECA');
    this.writeBtn = new Button(this.ctx, 360, 330, 'WRITE');

    this.initComponents();
  }

  private initComponents() {
    this.addrLeds.forEach((element) => {
      this.components.push(element);
    });

    this.dataLeds.forEach((element) => {
      this.components.push(element);
    });

    this.flagLeds.forEach((element) => {
      this.components.push(element);
    });

    this.registerLeds.forEach((element) => {
      this.components.push(element);
    });

    this.components.push(this.runLed);

    this.dataSws.forEach((element) => {
      this.components.push(element);
    });

    this.components.push(this.breakSw);
    this.components.push(this.stepSw);

    this.components.push(this.leftArrowBtn);
    this.components.push(this.rightArrowBtn);
    this.components.push(this.resetBtn);
    this.components.push(this.runBtn);
    this.components.push(this.stopBtn);
    this.components.push(this.setaBtn);
    this.components.push(this.incaBtn);
    this.components.push(this.decaBtn);
    this.components.push(this.writeBtn);
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

  setStopBtnFunc(f: () => void) {
    this.stopBtn.setEvent(f);
  }

  setRunBtnFunc(f: () => void) {
    this.runBtn.setEvent(f);
  }

  setResetBtnFunc(f: () => void) {
    this.resetBtn.setEvent(f);
  }

  getStepSwitchValue(): boolean {
    return this.stepSw.getState();
  }

  getBreakSwitchValue(): boolean {
    return this.breakSw.getState();
  }

  setLEDValue(val: number): void {
    return;
  }
}
