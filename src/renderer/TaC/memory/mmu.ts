import { IDataBus, IDmaSignal, IIntrSignal, IIOMmu, IPrivModeSignal } from '../interface';
import { ipl } from '../ipl';
import * as intr from '../interrupt/interruptNum';
import { TlbMissError, ReadonlyError } from '../error';

const TLB_ENTRY_SIZE = 16;

const ERROR_CAUSE_MEMORY_VIOLATION = 0x01;
const ERROR_CAUSE_BAD_ADDRESS = 0x02;

export class Mmu implements IDataBus, IIOMmu {
  private readonly memory: IDmaSignal;
  private readonly intrSignal: IIntrSignal;
  private readonly privSig: IPrivModeSignal;

  private tlbs: number[]; // TLBエントリ

  private iplMode: boolean; // IPLロード中ならtrue
  private mmuMode: boolean; // trueなら特権モード以外でp-f変換を行う
  private errorAddr: number; // メモリ保護違反が発生したときに原因となった論理アドレス
  private errorCause: number; // メモリ保護違反の原因
  private tlbMissPage: number; // TLBミス例外の原因となったページ番号

  constructor(memory: IDmaSignal, intrController: IIntrSignal, privSig: IPrivModeSignal) {
    this.memory = memory;
    this.intrSignal = intrController;
    this.privSig = privSig;
    this.tlbs = new Array(TLB_ENTRY_SIZE);

    this.iplMode = false;
    this.mmuMode = false;
    this.errorAddr = 0;
    this.errorCause = 0;
    this.tlbMissPage = 0;
  }

  write8(addr: number, val: number): void {
    if (this.iplMode) {
      if (addr >= 0xe000) {
        throw new ReadonlyError();
      }
    }

    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry === -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].writeFlag) {
        /* メモリ保護違反(Writeフラグが0) */
        this.errorAddr = addr;
        this.errorCause = ERROR_CAUSE_MEMORY_VIOLATION;
        this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
        return;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    this.memory.write8(addr, val);
  }

  read8(addr: number): number {
    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry === -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].readFlag) {
        /* メモリ保護違反(Readフラグが0) */
        this.errorAddr = addr;
        this.errorCause |= ERROR_CAUSE_MEMORY_VIOLATION;
        this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
        return 0;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    return this.memory.read8(addr);
  }

  write16(addr: number, val: number): void {
    if (addr % 2 === 1) {
      this.errorAddr = addr;
      this.errorCause = ERROR_CAUSE_BAD_ADDRESS;
      this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
      return;
    } else if (this.iplMode) {
      if (addr >= 0xe000) {
        throw new ReadonlyError();
      }
    }

    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry === -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].writeFlag) {
        /* メモリ保護違反(Writeフラグが0) */
        this.errorAddr = addr;
        this.errorCause = ERROR_CAUSE_MEMORY_VIOLATION;
        this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
        return;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    this.memory.write8(addr, (val & 0xff00) >> 8);
    this.memory.write8(addr + 1, val & 0x00ff);
  }

  read16(addr: number): number {
    if (addr % 2 === 1) {
      /* メモリ保護違反(奇数アドレス) */
      this.errorAddr = addr;
      this.errorCause |= ERROR_CAUSE_BAD_ADDRESS;
      this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
      return 0;
    }

    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const page = (addr & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry === -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].readFlag) {
        /* メモリ保護違反(Readフラグが0) */
        this.errorAddr = addr;
        this.errorCause |= ERROR_CAUSE_MEMORY_VIOLATION;
        this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
        return 0;
      }

      const frame = this.tlbs[entry].frame;
      addr = (frame << 8) | (addr & 0x00ff);
    }

    return (this.memory.read8(addr) << 8) | this.memory.read8(addr + 1);
  }

  fetch(pc: number): number {
    if (pc % 2 === 1) {
      /* メモリ保護違反(奇数アドレス) */
      this.errorAddr = pc;
      this.errorCause |= ERROR_CAUSE_BAD_ADDRESS;
      this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
      return 0;
    }

    /* MMUが有効かつ特権モード以外ならp-f変換を行う */
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const page = (pc & 0xff00) >> 8;
      const entry = this.searchTlbNum(page);
      if (entry === -1) {
        /* TLBミス */
        this.tlbMissPage = page;
        this.intrSignal.interrupt(intr.EXCP_TLB_MISS);
        throw new TlbMissError();
      } else if (!this.tlbs[entry].executeFlag) {
        /* メモリ保護違反(Executeフラグが0) */
        this.errorAddr = pc;
        this.errorCause |= ERROR_CAUSE_MEMORY_VIOLATION;
        this.intrSignal.interrupt(intr.EXCP_MEMORY_ERROR);
        return 0;
      }

      const frame = this.tlbs[entry].frame;
      pc = (frame << 8) | (pc & 0x00ff);
    }

    return (this.memory.read8(pc) << 8) | this.memory.read8(pc + 1);
  }

  private searchTlbNum(page: number): number {
    for (let i = 0; i < TLB_ENTRY_SIZE; i++) {
      if (this.tlbs[i].validFlag && this.tlbs[i].page === page) {
        return i;
      }
    }
    return -1;
  }

  loadIpl(): void {
    if (this.iplMode) {
      return;
    }

    for (let i = 0; i < ipl.length; i++) {
      this.write16(0xe000 + i * 2, ipl[i]);
    }
    this.iplMode = true;
  }

  detachIpl(): void {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
  }

  setTlbHigh8(entryNum: number, val: number): void {
    const low = this.tlbs[entryNum] & 0x0000ffff;
    this.tlbs[entryNum] = val | low;
  }

  setTlbLow16(entryNum: number, val: number): void {
    const high = this.tlbs[entryNum] & 0x00ff0000;
    this.tlbs[entryNum] = high | val;
  }

  getTlbHigh8(entryNum: number): number {
    return (this.tlbs[entryNum] & 0x00ff0000) >> 16;
  }

  getTlbLow16(entryNum: number): number {
    return this.tlbs[entryNum] & 0x0000ffff;
  }

  getErrorAddr(): number {
    return this.errorAddr;
  }

  getErrorCause(): number {
    // IN命令でエラー原因を読むと0にクリアされる
    const cause = this.errorCause;
    this.errorCause = 0;

    return cause;
  }

  getErrorPage(): number {
    return this.tlbMissPage;
  }

  enable(): void {
    this.mmuMode = true;
  }

  reset(): void {
    this.clearMemory();
    this.tlbs.fill(0);

    this.iplMode = false;
    this.mmuMode = false;
    this.errorAddr = 0;
    this.errorCause = 0;
    this.tlbMissPage = 0;
  }

  private clearMemory(): void {
    for (let i = 0; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
  }
}
