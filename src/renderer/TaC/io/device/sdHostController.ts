import { IDmaSignal, IIOSdHostController, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptKind';

const SECTOR_SIZE = 512;

export class SdHostController implements IIOSdHostController {
  private idleFlag: boolean; // アイドル状態かどうか(falseなら処理中)
  private errorFlag: boolean; // エラーが発生しているかどうか
  private intrFlag: boolean; // trueであれば処理終了後に割り込みを発生させる
  private memAddr: number; // 読み書きするデータを格納するバッファのアドレス
  private secAddrH: number; // セクタのアドレス(LBA方式)の上位16ビット
  private secAddrL: number; // セクタのアドレス(LBA方式)の下位16ビット

  private memory: IDmaSignal; // DMA方式で接続されているメモリ
  private intrSig: IIntrSignal; // 割込み信号

  constructor(memory: IDmaSignal, intrSig: IIntrSignal) {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.memAddr = 0;
    this.secAddrH = 0;
    this.secAddrL = 0;
    this.memory = memory;
    this.intrSig = intrSig;
  }

  startReading(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    window.electronAPI
      .readSct(this.secAddr())
      .then((data) => {
        // 読み込んだ値をメモリにコピーする
        for (let i = 0; i < SECTOR_SIZE; i++) {
          this.memory.write8(this.memAddr + i, data[i]);
        }

        this.idleFlag = true;
        if (this.intrFlag) {
          this.intrSig.interrupt(intr.MICRO_SD);
        }
      })
      .catch(() => {
        // もし読み込みでエラーが発生したらerrorFlagをtrueにする
        // エラーが発生しているときidleFlagはfalseになる(TeC7/tac_spi.vhd参考)
        this.errorFlag = true;
        this.idleFlag = false;
      });
  }

  startWriting(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    // 書き込む値をメモリからコピーしてくる
    const data = new Uint8Array(SECTOR_SIZE);
    for (let i = 0; i < SECTOR_SIZE; i++) {
      data[i] = this.memory.read8(this.memAddr + i);
    }

    window.electronAPI
      .writeSct(this.secAddr(), data)
      .then(() => {
        this.idleFlag = true;
        if (this.intrFlag) {
          this.intrSig.interrupt(intr.MICRO_SD);
        }
      })
      .catch(() => {
        this.errorFlag = true;
        this.idleFlag = false;
      });
  }

  getMemAddr(): number {
    return this.memAddr;
  }

  setMemAddr(addr: number): void {
    this.memAddr = addr;
  }

  getSecAddrH(): number {
    return this.secAddrH;
  }

  getSecAddrL(): number {
    return this.secAddrL;
  }

  setSecAddrH(addrH: number): void {
    this.secAddrH = addrH;
  }

  setSecAddrL(addrL: number): void {
    this.secAddrL = addrL;
  }

  /**
   * セクタアドレスの上位ビットと下位ビットを結合する
   *
   * @return secAddrH << 16 | secAddrH
   */
  private secAddr(): number {
    return (this.secAddrH << 16) | this.secAddrL;
  }

  setIntrFlag(flag: boolean): void {
    this.intrFlag = flag;
  }

  isIdle(): boolean {
    return this.idleFlag;
  }

  isErrorOccurred(): boolean {
    return this.errorFlag;
  }

  init(): void {
    // 実機ではmicroSDのドライバを初期化してから割込みを出すが
    // シミュレータではすぐに割込みを出して終了
    if (this.intrFlag) {
      this.intrSig.interrupt(intr.MICRO_SD);
    }
  }

  reset(): void {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.memAddr = 0;
    this.secAddrH = 0;
    this.secAddrL = 0;
  }
}
