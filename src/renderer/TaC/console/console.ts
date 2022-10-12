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
  private stepSw: Switch;
  private breakSw: Switch;

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
    this.dataLeds = new Array(8);
    for (let i = 0; i <= 3; i++) {
      this.addrLeds[i] = new Led(this.ctx, 69 + i * 42, 44, '', 'red');
      this.dataLeds[i] = new Led(this.ctx, 69 + i * 42, 94, '', 'green');
    }
    for (let i = 4; i < 8; i++) {
      this.addrLeds[i] = new Led(this.ctx, 249 + (i - 4) * 42, 44, '', 'red');
      this.dataLeds[i] = new Led(this.ctx, 249 + (i - 4) * 42, 94, '', 'green');
    }

    this.flagLeds = new Array(3);
    for (let i = 0; i < 3; i++) {
      this.flagLeds[i] = new Led(ctx, 358 + i * 26, 152, '', 'yellow');
    }

    this.registerLeds = new Array(6);
    for (let i = 0; i < 6; i++) {
      this.registerLeds[i] = new Led(ctx, 112 + i * 34, 152, '', 'yellow');
    }

    this.runLed = new Led(ctx, 409, 69, 'RUN', 'red');

    this.dataSws = new Array(8);
    for (let i = 0; i <= 3; i++) {
      this.dataSws[i] = new Switch(this.ctx, 54 + i * 42, 226, '');
    }
    for (let i = 4; i < 8; i++) {
      this.dataSws[i] = new Switch(this.ctx, 236 + (i - 4) * 42, 226, '');
    }

    this.breakSw = new Switch(this.ctx, 54, 312, 'BREAK');
    this.stepSw = new Switch(this.ctx, 96, 312, 'STEP');

    this.leftArrowBtn = new Button(this.ctx, 54, 138, '<-');
    this.rightArrowBtn = new Button(this.ctx, 309, 138, '->');
    this.resetBtn = new Button(this.ctx, 7, 312, 'RESET');
    this.runBtn = new Button(this.ctx, 138, 312, 'RUN');
    this.stopBtn = new Button(this.ctx, 180, 312, 'STOP');
    this.setaBtn = new Button(this.ctx, 236, 312, 'SETA');
    this.incaBtn = new Button(this.ctx, 278, 312, 'INCA');
    this.decaBtn = new Button(this.ctx, 320, 312, 'DECA');
    this.writeBtn = new Button(this.ctx, 362, 312, 'WRITE');

    this.initComponents();
  }

  private initComponents() {
    /* 全ての部品をcomponents[]に追加する */
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

    const img = document.getElementById('tac-image');
    if (img !== null) {
      this.ctx.drawImage(img as HTMLImageElement, 0, 0);
    }

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
