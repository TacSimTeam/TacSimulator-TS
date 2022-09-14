import { IKeyboardDriver } from '../../../interface/keyboardDriver';
import { IIOSerial, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

/**
 * TaCのUSBシリアル変換IC(FT232RL)を再現したもの
 * キーボード入力を実現するための機能を実装している
 */
export class Ft232rl implements IIOSerial, IKeyboardDriver {
  /**
   * 書き込み可能かどうか
   *
   * 便宜上このフラグは存在するが
   * シミュレータ上では特に意味が無いので常にTrueとしている
   */
  private isWriteable: boolean;

  /* 読み込み可能かどうか */
  private isReadable: boolean;

  /* Trueであれば送信可能になった時に割込みを発生させる */
  private sendableIntrFlag: boolean;

  /* Trueであれば受信可能になった時に割込みを発生させる */
  private receivableIntrFlag: boolean;

  /* Ctrlキーが押されたかどうか */
  private isClickedCtrl: boolean;

  /* Shiftキーが押されたかどうか */
  private isClickedShift: boolean;

  /* 送受信するデータのバッファ */
  private buf: number;

  private terminal: HTMLTextAreaElement; /* HTMLから取得したターミナル */
  private intrSignal: IIntrSignal; /* 割込み信号 */

  constructor(terminal: HTMLTextAreaElement, intrSignal: IIntrSignal) {
    this.isWriteable = true;
    this.isReadable = true;

    this.receivableIntrFlag = false;
    this.sendableIntrFlag = false;
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

  setSendableIntrFlag(flag: boolean): void {
    this.sendableIntrFlag = flag;
  }

  setReceivableIntrFlag(flag: boolean): void {
    this.receivableIntrFlag = flag;
  }

  send(val: number): void {
    /* 数値を文字列に変換する */
    const str = String.fromCodePoint(val);

    /* CRを除去してターミナルに文字を出力する */
    this.terminal.value += str.replace(/\r/, '');

    if (this.sendableIntrFlag) {
      this.intrSignal.interrupt(intr.FT232RL_SENT);
    }
  }

  receive(): number {
    return this.buf;
  }

  inputKeyUp(e: KeyboardEvent): void {
    return;
  }

  inputKeyDown(e: KeyboardEvent): void {
    console.log('key : ' + e.key);
    this.isReadable = false;

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
          return;
      }
    } else {
      const ch = e.key.codePointAt(0);
      if (ch === undefined) {
        this.buf = 0;
        return;
      }

      this.buf = ch;
    }

    console.log(String.fromCodePoint(this.buf));
    this.isReadable = true;
    if (this.receivableIntrFlag) {
      this.intrSignal.interrupt(intr.FT232RL_RECEIVED);
    }
  }

  private isMetaChar(e: KeyboardEvent): boolean {
    return e.key.length !== 1;
  }

  reset() {
    this.isWriteable = true;
    this.isReadable = true;
    this.receivableIntrFlag = false;
    this.sendableIntrFlag = false;
    this.isClickedCtrl = false;
    this.isClickedShift = false;
    this.buf = 0;
  }
}
