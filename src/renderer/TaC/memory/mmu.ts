import { IDataBus, IDmaSignal, IIplLoader, IIntrSignal, IIOMmu, IPrivModeSignal } from '../interface';
import { TlbEntry, tlbNumToObj, tlbObjToNum } from './tlb';
import { ipl } from '../ipl';
import * as intr from '../interrupt/interruptNum';
import { TlbMissError, ReadonlyError } from '../error';

const TLB_ENTRY_SIZE = 8;

const ERROR_CAUSE_BAD_ADDRESS = 0x02;
const ERROR_CAUSE_MEMORY_VIOLATION = 0x01;

export class Mmu implements IDataBus, IIOMmu, IIplLoader {
  private memory: IDmaSignal;
  private intrSignal: IIntrSignal;

  /* 特権モードであるかどうか */
  private privModesignal: IPrivModeSignal;

  /* TLBエントリ */
  private tlbs: TlbEntry[];

  /* IPLロード中ならtrue */
  private iplMode: boolean;

  /* trueなら特権モード以外でp-f変換を行う */
  private mmuMode: boolean;

  /* メモリ保護違反が発生したときに原因となった論理アドレス */
  private errorAddr: number;

  /* メモリ保護違反の原因 */
  private errorCause: number;

  /* TLBミス例外の原因となったページ番号 */
  private tlbMissPage: number;

  constructor(memory: IDmaSignal, intrController: IIntrSignal, privModeSignal: IPrivModeSignal) {
    this.memory = memory;
    this.intrSignal = intrController;
    this.privModesignal = privModeSignal;
    this.tlbs = [];
    this.initTlbs();

    this.iplMode = false;
    this.mmuMode = false;
    this.errorAddr = 0;
    this.errorCause = 0;
    this.tlbMissPage = 0;
  }

  private initTlbs() {
    for (let i = 0; i < TLB_ENTRY_SIZE; i++) {
      this.tlbs.push({
        page: 0,
        frame: 0,
        validFlag: false,
        referenceFlag: false,
        dirtyFlag: false,
        readFlag: false,
        writeFlag: false,
        executeFlag: false,
      });
    }
  }

  write8(addr: number, val: number) {
    this.memory.write8(addr, val);
  }

  read8(addr: number) {
    return this.memory.read8(addr);
  }

  write16(addr: number, val: number) {
    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privModesignal.getPrivMode()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry == -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].writeFlag) {
        /* メモリ保護違反(Writeフラグが0) */
        this.errorAddr = addr;
        this.errorCause = ERROR_CAUSE_MEMORY_VIOLATION;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    if (addr % 2 == 1) {
      this.errorAddr = addr;
      this.errorCause = ERROR_CAUSE_BAD_ADDRESS;
      this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
      return;
    } else if (this.iplMode) {
      if (addr >= 0xe000) {
        throw new ReadonlyError();
      }
    }

    this.memory.write8(addr, (val & 0xff00) >> 8);
    this.memory.write8(addr + 1, val & 0x00ff);
  }

  read16(addr: number) {
    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privModesignal.getPrivMode()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry == -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].readFlag) {
        /* メモリ保護違反(Readフラグが0) */
        this.errorAddr = addr;
        this.errorCause = ERROR_CAUSE_MEMORY_VIOLATION;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    if (addr % 2 == 1) {
      this.errorAddr = addr;
      this.errorCause = ERROR_CAUSE_BAD_ADDRESS;
      this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
      return 0;
    }

    return (this.memory.read8(addr) << 8) | this.memory.read8(addr + 1);
  }

  private searchTlbNum(page: number) {
    for (let i = 0; i < TLB_ENTRY_SIZE; i++) {
      if (this.tlbs[i].validFlag && this.tlbs[i].page == page) {
        return i;
      }
    }
    return -1;
  }

  loadIpl() {
    for (let i = 0; i < ipl.length; i++) {
      this.write16(0xe000 + i * 2, ipl[i]);
    }
    this.iplMode = true;
  }

  detachIpl() {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
  }

  setTlbHigh8(idx: number, val: number): void {
    /* TLBエントリの上位8ビットはページ番号なのでそのまま代入 */
    this.tlbs[idx].page = val & 0xff;
  }

  setTlbLow16(idx: number, val: number): void {
    /* tlbs[idx]の上位8ビット(ページ番号)だけ取り出す */
    const page = this.tlbs[idx].page & 0xff;

    /* ページ番号とvalを元にTlbEntry型に変換し代入 */
    this.tlbs[idx] = tlbNumToObj((page << 16) | val);
  }

  getTlbHigh8(idx: number): number {
    return this.tlbs[idx].page & 0xff;
  }

  getTlbLow16(idx: number): number {
    return tlbObjToNum(this.tlbs[idx]) & 0x0000ffff;
  }

  getErrorAddr(): number {
    return this.errorAddr;
  }

  getErrorCause(): number {
    /* IN命令でエラー原因を読むと0にクリアされる */
    const cause = this.errorCause;
    this.errorCause = 0;

    return cause;
  }

  getTlbMissPage(): number {
    return this.tlbMissPage;
  }

  enable(): void {
    this.mmuMode = true;
  }
}
