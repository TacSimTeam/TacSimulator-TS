import { IKeyboardDriver } from '../../../interface/keyboardDriver';
import { IIOSerial, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

export class Ft232rl implements IIOSerial, IKeyboardDriver {
  private isWriteable: boolean;
  private isReadable: boolean;
  private readableIntrFlag: boolean;
  private writeableIntrFlag: boolean;

  private isClickedCtrl: boolean;
  private isClickedShift: boolean;

  /* 送受信するデータのバッファ */
  private buf: number;

  private terminal: HTMLTextAreaElement;

  /* 割込み信号 */
  private intrSignal: IIntrSignal;

  constructor(terminal: HTMLTextAreaElement, intrSignal: IIntrSignal) {
    this.isWriteable = true;
    this.isReadable = true;
    this.readableIntrFlag = false;
    this.writeableIntrFlag = false;

    this.isClickedCtrl = false;
    this.isClickedShift = false;
    this.buf = 0;

    this.terminal = terminal;
    this.intrSignal = intrSignal;
  }

  getWriteableFlag(): boolean {
    return this.isWriteable;
  }

  getReadableFlag(): boolean {
    return this.isReadable;
  }

  setWriteableIntrFlag(flag: boolean): void {
    this.writeableIntrFlag = flag;
  }

  setReadableIntrFlag(flag: boolean): void {
    this.readableIntrFlag = flag;
  }

  send(val: number): void {
    new Promise<void>((resolve) => {
      // this.isWriteable = false;

      /* 数値を文字列に変換する */
      const str = String.fromCodePoint(val);

      /* CRを除去してターミナルに文字を出力する */
      this.terminal.value += str.replace(/\r/, '');
      resolve();
    }).then(() => {
      this.isWriteable = true;
      if (this.writeableIntrFlag) {
        this.intrSignal.interrupt(intr.FT232RL_SENT);
      }
    });
  }

  receive(): number {
    return this.buf;
  }

  inputKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Control') {
      this.isClickedCtrl = false;
    } else if (e.key === 'Shift') {
      this.isClickedShift = false;
    }
  }

  inputKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Control') {
      this.isClickedCtrl = true;
    } else if (e.key === 'Shift') {
      this.isClickedShift = true;
    }

    if (this.isMetaChar(e)) {
      switch (e.key) {
        case 'Escape':
          this.buf = 0x1b;
          break;
        case 'Tab':
          this.buf = 0x09;
          break;
        case 'Enter':
          this.buf = 0x0a;
          break;
        case 'Backspace':
          this.buf = 0x08;
          break;
        case 'Delete':
          this.buf = 0x7f;
          break;
        default:
          this.buf = 0;
      }

      if (this.buf !== 0) {
        this.readableIntrFlag = true;
        if (this.readableIntrFlag) {
          this.intrSignal.interrupt(intr.FT232RL_RECEIVED);
        }
      }
    } else {
      const ch = e.key.codePointAt(0);
      if (ch === undefined) {
        this.buf = 0;
        return;
      }

      if (0x20 <= ch && ch <= 0x7e) {
        this.buf = ch;
      }
      if (this.isClickedCtrl && this.isClickedShift) {
        if (0x40 <= this.buf && this.buf <= 0x5f) {
          this.buf = this.buf - 0x40;
        } else if (0x60 <= this.buf && this.buf <= 0x6e) {
          this.buf = this.buf - 0x60;
        }
      }

      this.readableIntrFlag = true;
      if (this.readableIntrFlag) {
        this.intrSignal.interrupt(intr.FT232RL_RECEIVED);
      }
    }
  }

  private isMetaChar(e: KeyboardEvent): boolean {
    return e.key.length !== 1;
  }
}
