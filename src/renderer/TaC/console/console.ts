import { Button } from './button';
import { Switch } from './switch';
import { Led } from './led';

import { IConsoleComponent, IDmaSignal, IIOConsole, IPsw, IRegister } from '../interface';

export class Console implements IIOConsole {
  private ctx: CanvasRenderingContext2D;
  private aCtx: AudioContext;

  private readonly width: number;
  private readonly height: number;

  /* コンソールはDMA方式でメモリとアクセスできる */
  private memory: IDmaSignal;

  /* PCとフラグを読むために必要 */
  private psw: IPsw;

  /* レジスタのデータを読み書きするので必要 */
  private register: IRegister;

  private components: [...IConsoleComponent[]];

  private memAddr: number;
  private memData: number;
  private rotSwCur: number;

  private addrLeds: Led[];
  private dataLeds: Led[];
  private flagLeds: Led[];
  private registerLeds: Led[];
  private runLed: Led;

  private dataSws: Switch[];
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

  constructor(canvas: HTMLCanvasElement, memory: IDmaSignal, psw: IPsw, register: IRegister) {
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
    this.psw = psw;
    this.register = register;

    this.components = [];

    this.memAddr = 0;
    this.memData = 0;
    this.rotSwCur = 0;

    // コンソール部品の初期化
    this.addrLeds = new Array(8);
    this.dataLeds = new Array(8);
    for (let i = 0; i <= 3; i++) {
      this.addrLeds[i] = new Led(this.ctx, 375 - i * 42, 44, 'red');
      this.dataLeds[i] = new Led(this.ctx, 375 - i * 42, 94, 'green');
    }
    for (let i = 4; i < 8; i++) {
      this.addrLeds[i] = new Led(this.ctx, 195 - (i - 4) * 42, 44, 'red');
      this.dataLeds[i] = new Led(this.ctx, 195 - (i - 4) * 42, 94, 'green');
    }

    this.flagLeds = new Array(3);
    for (let i = 0; i < 3; i++) {
      this.flagLeds[i] = new Led(ctx, 358 + i * 26, 152, 'yellow');
    }

    this.registerLeds = new Array(6);
    for (let i = 0; i < 6; i++) {
      this.registerLeds[i] = new Led(ctx, 112 + i * 34, 152, 'yellow');
    }

    this.runLed = new Led(ctx, 409, 69, 'red');

    this.dataSws = new Array(8);
    for (let i = 0; i <= 3; i++) {
      this.dataSws[i] = new Switch(this.ctx, 362 - i * 42, 226);
    }
    for (let i = 4; i < 8; i++) {
      this.dataSws[i] = new Switch(this.ctx, 180 - (i - 4) * 42, 226);
    }

    this.breakSw = new Switch(this.ctx, 54, 312);
    this.stepSw = new Switch(this.ctx, 96, 312);

    this.leftArrowBtn = new Button(this.ctx, 54, 138);
    this.rightArrowBtn = new Button(this.ctx, 309, 138);
    this.resetBtn = new Button(this.ctx, 7, 312);
    this.runBtn = new Button(this.ctx, 138, 312);
    this.stopBtn = new Button(this.ctx, 180, 312);
    this.setaBtn = new Button(this.ctx, 236, 312);
    this.incaBtn = new Button(this.ctx, 278, 312);
    this.decaBtn = new Button(this.ctx, 320, 312);
    this.writeBtn = new Button(this.ctx, 362, 312);

    this.initComponents();
    this.initButtons();

    this.updateRotSw();
    this.updateLED();
    this.drawAll();
  }

  private initComponents(): void {
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

  private initButtons(): void {
    this.leftArrowBtn.setEvent(() => {
      if (this.rotSwCur !== 0) {
        this.rotSwCur--;
      }
      this.updateRotSw();
      this.updateLED();
      this.drawAll();
    });

    this.rightArrowBtn.setEvent(() => {
      if (this.rotSwCur !== 17) {
        this.rotSwCur++;
      }
      this.updateRotSw();
      this.updateLED();
      this.drawAll();
    });

    this.setaBtn.setEvent(() => {
      this.memAddr = (this.memAddr << 8) | (this.readSwValue() & 0x00ff);
      this.updateRotSw();
      this.updateLED();
      if (this.dataLeds[0].getState()) {
        /* アドレスを設定するとき, LSBは光らせない */
        this.dataLeds[0].setState(false);
      }
      this.drawAll();
    });

    this.incaBtn.setEvent(() => {
      if (this.memAddr === 0xfffe) {
        this.memAddr = 0;
      } else {
        this.memAddr += 2;
      }
      this.updateRotSw();
      this.updateLED();
      this.drawAll();
    });

    this.decaBtn.setEvent(() => {
      if (this.memAddr === 0) {
        this.memAddr = 0xfffe;
      } else {
        this.memAddr -= 2;
      }
      this.updateRotSw();
      this.updateLED();
      this.drawAll();
    });

    this.writeBtn.setEvent(() => {
      this.writeReg(this.readSwValue());
      this.updateRotSw();
      this.updateLED();
      this.drawAll();
    });
  }

  private updateRotSw(): void {
    for (let i = 0; i < 6; i++) {
      if (i === this.rotSwCur % 6) {
        this.registerLeds[i].setState(true);
      } else {
        this.registerLeds[i].setState(false);
      }
    }

    for (let i = 0; i < 3; i++) {
      if (i === Math.trunc(this.rotSwCur / 6)) {
        this.flagLeds[i].setState(true);
      } else {
        this.flagLeds[i].setState(false);
      }
    }
  }

  updateLED(): void {
    const val = this.readReg();
    this.addrLeds[7].setState((val & (1 << 15)) !== 0);
    this.addrLeds[6].setState((val & (1 << 14)) !== 0);
    this.addrLeds[5].setState((val & (1 << 13)) !== 0);
    this.addrLeds[4].setState((val & (1 << 12)) !== 0);
    this.addrLeds[3].setState((val & (1 << 11)) !== 0);
    this.addrLeds[2].setState((val & (1 << 10)) !== 0);
    this.addrLeds[1].setState((val & (1 << 9)) !== 0);
    this.addrLeds[0].setState((val & (1 << 8)) !== 0);
    this.dataLeds[7].setState((val & (1 << 7)) !== 0);
    this.dataLeds[6].setState((val & (1 << 6)) !== 0);
    this.dataLeds[5].setState((val & (1 << 5)) !== 0);
    this.dataLeds[4].setState((val & (1 << 4)) !== 0);
    this.dataLeds[3].setState((val & (1 << 3)) !== 0);
    this.dataLeds[2].setState((val & (1 << 2)) !== 0);
    this.dataLeds[1].setState((val & (1 << 1)) !== 0);
    this.dataLeds[0].setState((val & (1 << 0)) !== 0);
    this.drawAll();
  }

  readReg(): number {
    switch (this.rotSwCur) {
      case 14:
        return this.psw.getPC();
      case 15:
        return this.psw.getFlags();
      case 16:
        return this.memData;
      case 17:
        return this.memAddr;
      default:
        return this.register.read(this.rotSwCur);
    }
  }

  writeReg(val: number): void {
    const regVal = this.readReg();
    switch (this.rotSwCur) {
      case 14:
        this.psw.jumpTo(((this.psw.getPC() & 0x00ff) << 8) | (val & 0x00ff));
        break;
      case 15:
        this.psw.setFlags(((this.psw.getFlags() & 0x00ff) << 8) | (val & 0x00ff));
        break;
      case 16:
      case 17:
        this.memData = ((this.memData & 0x00ff) << 8) | (val & 0x00ff);
        break;
      default:
        this.register.write(this.rotSwCur, ((regVal & 0x00ff) << 8) | (val & 0x00ff));
        break;
    }
  }

  readSwValue(): number {
    let val = 0;
    if (this.dataSws[0].getState()) val |= 1 << 0;
    if (this.dataSws[1].getState()) val |= 1 << 1;
    if (this.dataSws[2].getState()) val |= 1 << 2;
    if (this.dataSws[3].getState()) val |= 1 << 3;
    if (this.dataSws[4].getState()) val |= 1 << 4;
    if (this.dataSws[5].getState()) val |= 1 << 5;
    if (this.dataSws[6].getState()) val |= 1 << 6;
    if (this.dataSws[7].getState()) val |= 1 << 7;
    return val;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawAll(): void {
    this.clear();

    const img = document.getElementById('console-image');
    if (img !== null) {
      this.ctx.drawImage(img as HTMLImageElement, 0, 0);
    }

    this.components.forEach((element) => {
      element.draw();
    });
  }

  onClick(posX: number, posY: number): void {
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

  setLEDLamps(val: number): void {}

  setStopBtnFunc(f: () => void): void {
    this.stopBtn.setEvent(f);
  }

  setRunBtnFunc(f: () => void): void {
    this.runBtn.setEvent(f);
  }

  setResetBtnFunc(f: () => void): void {
    this.resetBtn.setEvent(f);
  }

  getStepSwitchValue(): boolean {
    return this.stepSw.getState();
  }

  getBreakSwitchValue(): boolean {
    return this.breakSw.getState();
  }

  setRunLED(val: boolean): void {
    this.runLed.setState(val);
    this.updateLED();
    this.drawAll();
  }

  getMemData(): number {
    return this.memData;
  }

  getMemAddr(): number {
    return this.memAddr;
  }
}
