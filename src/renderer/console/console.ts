import { Button } from './button';
import { Switch } from './switch';
import { Led } from './led';

const COLOR_RED_LIGHT = '#ff0000';
const COLOR_RED_DARK = '#400000';
const COLOR_GREEN_LIGHT = '#00ff00';
const COLOR_GREEN_DARK = '#004000';
const COLOR_YELLOW_LIGHT = '#FFFF00';
const COLOR_YELLOW_DARK = '#DAA520';

const CONSOLE_WIDTH = 430;
const CONSOLE_HEIGHT = 390;

export class Console {
  private buttons: [...Button[]];
  private switches: [...Switch[]];
  private addrLeds: [...Led[]];
  private dataLeds: [...Led[]];
  private registerLeds: [...Led[]];
  private flagLeds: [...Led[]];

  /* RUN LEDは1つしかないけど, 他のLEDと同じように扱いたかった */
  private runLeds: [...Led[]];

  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.buttons = [];
    this.switches = [];
    this.addrLeds = [];
    this.dataLeds = [];
    this.registerLeds = [];
    this.flagLeds = [];
    this.runLeds = [];
    this.ctx = ctx;

    this.initLeds();
    this.initButtons();
    this.initSwitches();
  }

  private initLeds() {
    /* アドレスLED */
    for (let i = 0; i < 8; i++) {
      let x = 370 - i * 40;
      if (i > 3) {
        x = x - 20;
      }
      this.addrLeds.push(new Led(x, 30, 'A' + i, COLOR_RED_LIGHT, COLOR_RED_DARK));
    }

    /* データLED */
    this.dataLeds.push(new Led(370, 90, 'D0', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(330, 90, 'D1', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(290, 90, 'D2', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(250, 90, 'D3', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(190, 90, 'D4', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(150, 90, 'D5', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(110, 90, 'D6', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));
    this.dataLeds.push(new Led(70, 90, 'D7', COLOR_GREEN_LIGHT, COLOR_GREEN_DARK));

    /* ロータリースイッチのLED */
    this.registerLeds.push(new Led(105, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.registerLeds.push(new Led(139, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.registerLeds.push(new Led(173, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.registerLeds.push(new Led(207, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.registerLeds.push(new Led(241, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.registerLeds.push(new Led(275, 160, 'G0', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));

    /* フラグのLED */
    this.flagLeds.push(new Led(350, 160, 'C', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.flagLeds.push(new Led(380, 160, 'S', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));
    this.flagLeds.push(new Led(410, 160, 'Z', COLOR_YELLOW_LIGHT, COLOR_YELLOW_DARK));

    this.runLeds.push(new Led(400, 60, 'RUN', COLOR_RED_LIGHT, COLOR_RED_DARK));
  }

  private initButtons() {
    this.buttons.push(
      new Button(295, 150, '->', () => {
        console.log('-> pushed');
      })
    );
    this.buttons.push(
      new Button(60, 150, '<-', () => {
        console.log('<- pushed');
      })
    );
    this.buttons.push(
      new Button(360, 330, 'WRITE', () => {
        console.log('WRITE pushed');
      })
    );
    this.buttons.push(
      new Button(320, 330, 'DECA', () => {
        console.log('DECA pushed');
      })
    );
    this.buttons.push(
      new Button(280, 330, 'INCA', () => {
        console.log('INCA pushed');
      })
    );
    this.buttons.push(
      new Button(240, 330, 'SETA', () => {
        console.log('SETA pushed');
      })
    );
    this.buttons.push(
      new Button(180, 330, 'STOP', () => {
        console.log('STOP pushed');
      })
    );
    this.buttons.push(
      new Button(140, 330, 'RUN', () => {
        console.log('RUN pushed');
      })
    );
    this.buttons.push(
      new Button(20, 330, 'RESET', () => {
        console.log('RESET pushed');
      })
    );
  }

  private initSwitches() {
    for (let i = 0; i < 8; i++) {
      let x = 360 - i * 40;
      if (i > 3) {
        x = x - 20;
      }
      this.switches.push(new Switch(x, 250, 'D' + i));
    }

    this.switches.push(new Switch(100, 330, 'STEP'));
    this.switches.push(new Switch(60, 330, 'BREAK'));
  }

  drawButtons() {
    this.buttons.forEach((element) => {
      this.ctx.beginPath();
      this.ctx.rect(element.posX, element.posY, 26, 26);
      this.ctx.fillStyle = '#777777';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(element.posX + 13, element.posY + 13, 8, (0 * Math.PI) / 180, (360 * Math.PI) / 180, false);
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fill();
      this.ctx.fillStyle = '#000080';
      this.ctx.font = '10px serif';
      this.ctx.fillText(element.name, element.posX + 12, element.posY + 38);
    });
  }

  drawSwitches() {
    this.switches.forEach((element) => {
      this.ctx.clearRect(element.posX - 5, element.posY - 14, 40, 65);
      this.ctx.beginPath();
      this.ctx.rect(element.posX, element.posY, 26, 26);
      this.ctx.fillStyle = '#777777';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(element.posX + 13, element.posY + 13, 10, (0 * Math.PI) / 180, (360 * Math.PI) / 180, false);
      this.ctx.fillStyle = '#000000';
      this.ctx.fill();

      this.ctx.beginPath();
      if (element.getState() === true) {
        this.ctx.rect(element.posX + 9, element.posY + 12, 8, -20);
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.rect(element.posX + 9, element.posY - 12, 8, 8);
        this.ctx.fillStyle = '#993300';
        this.ctx.fill();
      } else {
        this.ctx.rect(element.posX + 9, element.posY + 12, 8, 20);
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.rect(element.posX + 9, element.posY + 30, 8, 8);
        this.ctx.fillStyle = '#993300';
        this.ctx.fill();
      }
      this.ctx.beginPath();
      this.ctx.fillStyle = '#000080';
      this.ctx.font = '10px serif';
      this.ctx.fillText(element.name, element.posX + 12, element.posY + 50);
    });
  }

  private drawLed(element: Led) {
    this.ctx.beginPath();
    this.ctx.arc(element.posX, element.posY, 10, 0, Math.PI * 2, false);
    if (element.getState() === true) {
      this.ctx.fillStyle = element.onColor;
    } else {
      this.ctx.fillStyle = element.offColor;
    }
    this.ctx.fill();
  }

  drawLeds() {
    this.addrLeds.forEach((element) => {
      this.drawLed(element);
    });
    this.dataLeds.forEach((element) => {
      this.drawLed(element);
    });
    this.registerLeds.forEach((element) => {
      this.drawLed(element);
    });
    this.flagLeds.forEach((element) => {
      this.drawLed(element);
    });
    this.runLeds.forEach((element) => {
      this.drawLed(element);
    });
  }

  drawAll() {
    this.drawButtons();
    this.drawSwitches();
    this.drawLeds();
  }

  click(x: number, y: number) {
    this.buttons.forEach((element) => {
      element.click(x, y);
    });
    this.switches.forEach((element) => {
      element.click(x, y);
    });
    this.ctx.clearRect(0, 0, CONSOLE_WIDTH, CONSOLE_HEIGHT);
    this.drawAll();
  }
}
