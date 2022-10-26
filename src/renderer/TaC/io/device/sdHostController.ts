import { IDmaSignal, IIOSdHostController, IIntrSignal } from '../../interface';
import * as intr from '../../interrupt/interruptNum';

const SECTOR_SIZE = 512;

export class SdHostController implements IIOSdHostController {
  /* アイドル状態かどうか(falseなら処理中) */
  private idleFlag: boolean;

  /* エラーが発生しているかどうか */
  private errorFlag: boolean;

  /* セクタから読み込んだ、または書き込むデータを格納するバッファのアドレス */
  private memAddr: number;

  /* セクタのアドレス(LBA方式)の上位16ビット */
  private secAddrH: number;

  /* セクタのアドレス(LBA方式)の下位16ビット */
  private secAddrL: number;

  /* DMA方式で接続されているメモリ */
  private memory: IDmaSignal;

  /* trueであれば処理終了後に割り込みを発生させる */
  private intrFlag: boolean;

  /* 割込み信号 */
  private intrSignal: IIntrSignal;

  constructor(memory: IDmaSignal, intrSignal: IIntrSignal) {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
    this.memAddr = 0;
    this.memory = memory;
    this.intrSignal = intrSignal;
  }

  isIdle(): boolean {
    return this.idleFlag;
  }

  isOccurredError(): boolean {
    return this.errorFlag;
  }

  setIntrFlag(flag: boolean): void {
    this.intrFlag = flag;
  }

  init(): void {
    this.idleFlag = true;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
  }

  startReading(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    console.log('Start reading microSD');

    window.electronAPI
      .readSct(this.secAddr())
      .then((data) => {
        /* 読み込んだ値をメモリにコピーする */
        for (let i = 0; i < SECTOR_SIZE; i++) {
          this.memory.write8(this.memAddr + i, data[i]);
        }

        // console.log(
        //   'Memory address : 0x' + this.memAddr.toString(16) + ' ~ 0x' + (this.memAddr + SECTOR_SIZE - 1).toString(16)
        // );
        // console.log('Sector address : 0x' + this.secAddr().toString(16) + '(' + this.secAddr() + ')');
        // console.log(data);
      })
      .then(() => {
        this.idleFlag = true;
        if (this.intrFlag) {
          this.intrSignal.interrupt(intr.MICRO_SD);
        }
      })
      .catch(() => {
        /**
         * もし読み込みでエラーが発生したらフラグを立てる
         * エラーが発生しているときアイドル状態はfalseになる(TeC7/tac_spi.vhd参考)
         */
        this.errorFlag = true;
        this.idleFlag = false;
      });
  }

  startWriting(): void {
    if (!this.idleFlag) {
      return;
    }
    this.idleFlag = false;

    new Promise<void>(() => {
      const data = new Uint8Array(SECTOR_SIZE);

      /* 書き込む値をメモリからコピーしてくる */
      for (let i = 0; i < SECTOR_SIZE; i++) {
        data[i] = this.memory.read8(this.memAddr + i);
      }

      window.electronAPI
        .writeSct(this.secAddr(), data)
        .then(() => {
          this.idleFlag = true;
          if (this.intrFlag) {
            this.intrSignal.interrupt(intr.MICRO_SD);
          }
        })
        .catch(() => {
          this.errorFlag = true;
          this.idleFlag = false;
        });
    });
  }

  getMemAddr(): number {
    return this.memAddr;
  }

  setMemAddr(addr: number): void {
    this.memAddr = addr;
  }

  setSecAddrH(addrH: number): void {
    this.secAddrH = addrH;
  }

  setSecAddrL(addrL: number): void {
    this.secAddrL = addrL;
  }

  getSecAddrH(): number {
    return this.secAddrH;
  }

  getSecAddrL(): number {
    return this.secAddrL;
  }

  private secAddr() {
    return (this.secAddrH << 16) + this.secAddrL;
  }

  reset() {
    this.idleFlag = false;
    this.errorFlag = false;
    this.intrFlag = false;
    this.secAddrH = 0;
    this.secAddrL = 0;
    this.memAddr = 0;
  }
}
