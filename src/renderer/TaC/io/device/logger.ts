import { check } from 'prettier';
import { querySelector } from '../../../util/dom.result';
import { IIOSerial, IIntrSignal } from '../../interface';
import { RN4020_SENT } from '../../interrupt/interruptKind';

/**
 * TaCのデバッグ用に作成した出力専用のシリアルIO機器
 *
 * 実機では, シリアル入出力に標準出力, Bluetooth側に標準エラー出力
 * を送信することでデバッグを行うが, シミュレータはBluetoothモジュールを使用しないため
 * 代わりにブラウザの開発者ツール内のコンソールにエラーを出力する
 */
export class Logger implements IIOSerial {
  private sendableIntrFlag: boolean; // 送信可能時の割込み発生フラグ

  private buf: string; // 出力するエラーのバッファ

  private intrSig: IIntrSignal; // 割込み信号

  private loggerSwitch: HTMLInputElement; // ロガーを有効にするかどうかのスイッチ(checkbox)

  constructor(intrSig: IIntrSignal) {
    this.sendableIntrFlag = false;
    this.buf = '';
    this.intrSig = intrSig;
    this.loggerSwitch = querySelector<HTMLInputElement>('#enable-logger').unwrap();
  }

  receive(): number {
    // 出力専用の機器なので不必要
    return 0;
  }

  send(val: number): void {
    if (!this.loggerSwitch.checked) {
      // ロガーが無効ならば何もしない
      this.buf = '';
    } else if (val === 0x08) {
      // バックスペースなら末尾を削除する
      this.buf = this.buf.slice(0, -1);
    } else {
      // CRを除去してターミナルに文字を出力する
      const ch = String.fromCodePoint(val).replace(/\r/, '');
      this.buf += ch;
      if (ch === '\n') {
        // 改行がきたらエラー文を出力し, バッファをクリアする
        console.info(this.buf);
        this.buf = '';
      }
    }

    if (this.sendableIntrFlag) {
      this.intrSig.interrupt(RN4020_SENT);
    }
  }

  setReceivableIntrFlag(flag: boolean): void {
    // 出力専用の機器なので不必要
  }

  setSendableIntrFlag(flag: boolean): void {
    this.sendableIntrFlag = flag;
    if (this.sendableIntrFlag) {
      this.intrSig.interrupt(RN4020_SENT);
    }
  }

  isReadable(): boolean {
    return false;
  }

  isWriteable(): boolean {
    return true;
  }

  reset(): void {
    this.sendableIntrFlag = false;
    this.buf = '';
  }
}
