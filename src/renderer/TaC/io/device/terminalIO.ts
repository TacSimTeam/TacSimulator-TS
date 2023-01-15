import { IIOSerial, IIntrSignal } from '../../interface';
import { IKeyboardDriver } from '../../../interface/keyboardDriver';
import { FT232RL_RECEIVED, FT232RL_SENT } from '../../interrupt/interruptKind';

/**
 * シミュレータのターミナルとの通信を行う機器
 *
 * TaCのUSBシリアル変換ICの代替
 * キーボード入力を実現するための機能を実装している
 */
export class TerminalIO implements IIOSerial, IKeyboardDriver {
  private sendableIntrFlag: boolean; // 送信可能時の割込み発生フラグ
  private receivableIntrFlag: boolean; // 受信可能時の割込み発生フラグ

  // バッファが空であるかどうか
  // 実際にバッファが空になるわけでは無いが、
  // 現在bufに入っているデータが既に送信済み、受信済みであればtrueとなる
  private emptyFlag: boolean;

  private buf: number; // 送受信するデータのバッファ

  private terminal: HTMLTextAreaElement; // HTMLから取得したターミナル
  private intrSig: IIntrSignal; // 割込み信号

  constructor(terminal: HTMLTextAreaElement, intrSig: IIntrSignal) {
    this.receivableIntrFlag = false;
    this.sendableIntrFlag = false;
    this.emptyFlag = true;
    this.buf = 0;
    this.terminal = terminal;
    this.intrSig = intrSig;
  }

  receive(): number {
    // bufのデータを受信し終えたのでbufを空として扱っていい
    this.emptyFlag = true;
    return this.buf;
  }

  send(val: number): void {
    if (val === 0x08) {
      // バックスペースなら末尾を削除する
      this.terminal.value = this.terminal.value.slice(0, -1);
    } else {
      // CRを除去してターミナルに文字を出力する
      const ch = String.fromCodePoint(val).replace(/\r/, '');
      this.terminal.value += ch;
      if (ch === '\n') {
        // ターミナル内の文字位置の調整
        this.terminal.scrollTop = this.terminal.scrollHeight;
      }
    }

    if (this.sendableIntrFlag) {
      this.intrSig.interrupt(FT232RL_SENT);
    }
  }

  // setSendableIntrFlag()とsetReceivableIntrFlag()についてのメモ
  //
  // 実際のTaCではSIO内の割込み許可フラグとemptyフラグのANDの
  // 立ち上がりのエッジを観測したときに割込み発生を通知する
  //
  // シミュレータ内では、割込み許可フラグが変更された時に
  // 割込み許可フラグとemptyフラグの両方がtrueであれば, 割込みを発生させる

  setReceivableIntrFlag(flag: boolean): void {
    this.receivableIntrFlag = flag;
    if (this.receivableIntrFlag && !this.emptyFlag) {
      this.intrSig.interrupt(FT232RL_RECEIVED);
    }
  }

  setSendableIntrFlag(flag: boolean): void {
    this.sendableIntrFlag = flag;
    if (this.sendableIntrFlag && this.emptyFlag) {
      this.intrSig.interrupt(FT232RL_SENT);
    }
  }

  isReadable(): boolean {
    return !this.emptyFlag;
  }

  isWriteable(): boolean {
    return this.emptyFlag;
  }

  inputKeyDown(e: KeyboardEvent): void {
    this.buf = this.keyToAscii(e.key);
    this.emptyFlag = false;

    if (this.receivableIntrFlag) {
      this.intrSig.interrupt(FT232RL_RECEIVED);
    }
  }

  /**
   * 押されたキーの名前の文字列をASCIIコードに変換する
   *
   * @param key KeyboardEventから取得した文字列
   * @return 変換したASCIIコード
   */
  private keyToAscii(key: string): number {
    if (key.length !== 1) {
      // key.lengthが1でないなら特殊文字
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

  reset(): void {
    this.sendableIntrFlag = false;
    this.receivableIntrFlag = false;
    this.emptyFlag = true;
    this.buf = 0;
  }
}
