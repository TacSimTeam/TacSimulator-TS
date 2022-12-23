import { IKeyboardDriver } from '../../../interface/keyboardDriver';
import { IIOSerial, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptKind';

/**
 * TaCのUSBシリアル変換IC(FT232RL)を再現したもの
 * キーボード入力を実現するための機能を実装している
 */
export class Ft232rl implements IIOSerial, IKeyboardDriver {
  /**
   * バッファが空であるかどうか
   *
   * 実際にバッファが空になるわけでは無いが、
   * 現在bufに入っているデータが既に送信済み、受信済みであればtrueとなる
   */
  private emptyFlag: boolean;

  /* 送受信するデータのバッファ */
  private buf: number;

  private terminal: HTMLTextAreaElement; /* HTMLから取得したターミナル */

  /* Trueであれば送信可能になった時に割込みを発生させる */
  private sendableIntrFlag: boolean;

  /* Trueであれば受信可能になった時に割込みを発生させる */
  private receivableIntrFlag: boolean;

  private intrSignal: IIntrSignal; /* 割込み信号 */

  constructor(terminal: HTMLTextAreaElement, intrSignal: IIntrSignal) {
    this.receivableIntrFlag = false;
    this.sendableIntrFlag = false;
    this.buf = 0;
    this.emptyFlag = true;
    this.terminal = terminal;
    this.intrSignal = intrSignal;
  }

  isWriteable(): boolean {
    return this.emptyFlag;
  }

  isReadable(): boolean {
    return !this.emptyFlag;
  }

  /*
   * setSendableIntrFlag()とsetReceivableIntrFlag()についてのメモ
   *
   * 実際のTaCではSIO内の割込み許可フラグとemptyフラグのANDの
   * 立ち上がりのエッジを観測したときに割込み発生を通知する
   *
   * シミュレータ内では、割込み許可フラグが変更された時に
   * 割込み許可フラグとemptyフラグの両方がrueであれば, 割込みを発生させる
   */

  setSendableIntrFlag(flag: boolean): void {
    this.sendableIntrFlag = flag;
    if (this.sendableIntrFlag && this.emptyFlag) {
      this.intrSignal.interrupt(intr.FT232RL_SENT);
    }
  }

  setReceivableIntrFlag(flag: boolean): void {
    this.receivableIntrFlag = flag;
    if (this.receivableIntrFlag && !this.emptyFlag) {
      this.intrSignal.interrupt(intr.FT232RL_RECEIVED);
    }
  }

  send(val: number): void {
    if (val === 0x08) {
      /* バックスペースなら末尾を削除する */
      this.terminal.value = this.terminal.value.slice(0, -1);
    } else {
      /* CRを除去してターミナルに文字を出力する */
      const ch = String.fromCodePoint(val).replace(/\r/, '');
      this.terminal.value += ch;
      if (ch == '\n') {
        /* 改行なら行の頭に空白を追加する */
        this.terminal.value += ' ';

        /* ターミナル内の文字位置の調整 */
        this.terminal.scrollTop = this.terminal.scrollHeight;
      }
    }

    /* bufのデータを送信したのでemptyをtrueに */
    this.emptyFlag = true;
    if (this.sendableIntrFlag) {
      this.intrSignal.interrupt(intr.FT232RL_SENT);
    }
  }

  receive(): number {
    /* この関数の処理でbufのデータを受信したのでemptyをtrueに */
    this.emptyFlag = true;
    return this.buf;
  }

  inputKeyDown(e: KeyboardEvent): void {
    this.buf = this.keyToAscii(e.key);

    // console.log('key : ' + e.key);
    // console.log(`${String.fromCodePoint(this.buf)}(0x${this.buf.toString(16)})`);

    this.emptyFlag = false;
    if (this.receivableIntrFlag) {
      this.intrSignal.interrupt(intr.FT232RL_RECEIVED);
    }
  }

  /* 押されたキーの名前の文字列をASCIIコードに変換する */
  private keyToAscii(key: string): number {
    if (key.length !== 1) {
      /* key.lengthが1でないなら特殊文字 */
      switch (key) {
        case 'Backspace':
          return 0x08;
        case 'Tab':
          return 0x09;
        case 'Enter':
          return 0x0d;
        case 'Escape':
          return 0x1b;
        case 'Delete':
          return 0x7f;
        default:
          return 0;
      }
    }

    const ch = key.codePointAt(0);
    if (ch === undefined) {
      return 0;
    }
    return ch;
  }

  reset() {
    this.receivableIntrFlag = false;
    this.sendableIntrFlag = false;
    this.buf = 0;
    this.emptyFlag = true;
  }
}
