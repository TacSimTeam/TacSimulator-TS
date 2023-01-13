import { IDataBus, IIntrSignal, IIOMmu, IPrivModeSignal } from '../interface';
import { TlbEntry } from './tlb';
import { ipl } from '../ipl';
import { TlbMissError, ReadonlyError } from '../error';
import * as intr from '../interrupt/interruptKind';

const TLB_ENTRY_SIZE = 16;

const ERROR_CAUSE_MEMORY_VIOLATION = 0x01;
const ERROR_CAUSE_BAD_ADDRESS = 0x02;

export class Mmu implements IDataBus, IIOMmu {
  private memory: IDataBus;
  private intrSig: IIntrSignal;
  private privSig: IPrivModeSignal;

  private tlbs: TlbEntry[]; // TLBエントリ

  private iplMode: boolean; // IPLロード中ならtrue
  private mmuMode: boolean; // trueなら特権モード以外でp-f変換を行う
  private errorAddr: number; // メモリ保護違反が発生したときに原因となった論理アドレス
  private errorCause: number; // メモリ保護違反の原因
  private tlbMissPage: number; // TLBミス例外の原因となったページ番号

  constructor(memory: IDataBus, intrSig: IIntrSignal, privSig: IPrivModeSignal) {
    this.memory = memory;
    this.intrSig = intrSig;
    this.privSig = privSig;
    this.tlbs = new Array(TLB_ENTRY_SIZE);
    this.initTlbEntries();

    this.iplMode = false;
    this.mmuMode = false;
    this.errorAddr = 0;
    this.errorCause = 0;
    this.tlbMissPage = 0;
  }

  private initTlbEntries(): void {
    for (let i = 0; i < TLB_ENTRY_SIZE; i++) {
      this.tlbs[i] = new TlbEntry(0);
    }
  }

  read8(addr: number): number {
    // MMUが有効かつ特権モード以外ならp-f変換を行う
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const entry = this.vAddrToEntry(addr);

      if (!entry.isReadable()) {
        this.reportMemVioError(addr);
        return 0;
      }

      entry.setReferenceFlag();
      addr = (entry.getFrame() << 8) | (addr & 0x00ff);
    }

    return this.memory.read8(addr);
  }

  write8(addr: number, val: number): void {
    if (this.iplMode && addr >= 0xe000) {
      // IPL実行中0xe000~0xffffはReadonlyとなる
      throw new ReadonlyError();
    }

    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const entry = this.vAddrToEntry(addr);

      if (!entry.isWritable()) {
        this.reportMemVioError(addr);
        return;
      }

      entry.setReferenceFlag();
      entry.setDirtyFlag();
      addr = (entry.getFrame() << 8) | (addr & 0x00ff);
    }

    this.memory.write8(addr, val);
  }

  read16(addr: number): number {
    if (addr % 2 === 1) {
      this.reportBadAddrError(addr);
      return 0;
    }

    // MMUが有効かつ特権モード以外ならp-f変換を行う
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const entry = this.vAddrToEntry(addr);

      if (!entry.isReadable()) {
        this.reportMemVioError(addr);
        return 0;
      }

      entry.setReferenceFlag();
      addr = (entry.getFrame() << 8) | (addr & 0x00ff);
    }

    return this.memory.read16(addr);
  }

  write16(addr: number, val: number): void {
    if (addr % 2 === 1) {
      this.reportBadAddrError(addr);
      return;
    }

    if (this.iplMode && addr >= 0xe000) {
      throw new ReadonlyError();
    }

    // MMUが有効かつ特権モード以外ならp-f変換を行う
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const entry = this.vAddrToEntry(addr);

      if (!entry.isWritable()) {
        this.reportMemVioError(addr);
        return;
      }

      entry.setReferenceFlag();
      entry.setDirtyFlag();
      addr = (entry.getFrame() << 8) | (addr & 0x00ff);
    }

    return this.memory.write16(addr, val);
  }

  fetch(pc: number): number {
    if (pc % 2 === 1) {
      this.reportBadAddrError(pc);
      return 0;
    }

    // MMUが有効かつ特権モード以外ならp-f変換を行う
    if (this.mmuMode && !this.privSig.getPrivFlag()) {
      const entry = this.vAddrToEntry(pc);

      if (!entry.isExecutable()) {
        this.reportMemVioError(pc);
        return 0;
      }

      entry.setReferenceFlag();
      pc = (entry.getFrame() << 8) | (pc & 0x00ff);
    }

    return this.memory.fetch(pc);
  }

  /**
   * 論理アドレスからTLBエントリを取得する
   * 存在しない場合はTLBミス例外を投げる
   *
   * @param addr
   * @returns
   */
  private vAddrToEntry(vAddr: number): TlbEntry {
    const page = (vAddr & 0xff00) >> 8;
    const entryNum = this.searchTlbNum(page);

    if (entryNum === null) {
      this.reportTlbMissError(page);
      throw new TlbMissError();
    }

    return this.tlbs[entryNum];
  }

  /**
   * TLBエントリの逆引き
   *
   * @param page ページ番号
   * @return 有効なTLBエントリが存在するならそのインデックス, 無いならnull
   */
  private searchTlbNum(page: number): number | null {
    for (let i = 0; i < TLB_ENTRY_SIZE; i++) {
      if (this.tlbs[i].isValid() && this.tlbs[i].getPage() === page) {
        return i;
      }
    }
    return null;
  }

  private reportTlbMissError(page: number): void {
    this.tlbMissPage = page;
    this.intrSig.interrupt(intr.EXCP_TLB_MISS);
  }

  private reportBadAddrError(addr: number): void {
    this.errorAddr = addr;
    this.errorCause |= ERROR_CAUSE_BAD_ADDRESS;
    this.intrSig.interrupt(intr.EXCP_MEMORY_ERROR);
  }

  private reportMemVioError(addr: number): void {
    this.errorAddr = addr;
    this.errorCause |= ERROR_CAUSE_MEMORY_VIOLATION;
    this.intrSig.interrupt(intr.EXCP_MEMORY_ERROR);
  }

  getTlbHigh8(entryNum: number): number {
    return this.tlbs[entryNum].getHigh8();
  }

  getTlbLow16(entryNum: number): number {
    return this.tlbs[entryNum].getLow16();
  }

  setTlbHigh8(entryNum: number, val: number): void {
    this.tlbs[entryNum].setHigh8(val);
  }

  setTlbLow16(entryNum: number, val: number): void {
    this.tlbs[entryNum].setLow16(val);
  }

  getErrorAddr(): number {
    return this.errorAddr;
  }

  getErrorCause(): number {
    const cause = this.errorCause;

    // IN命令でエラー原因を読むと0にクリアされる
    this.errorCause = 0;

    return cause;
  }

  getErrorPage(): number {
    return this.tlbMissPage;
  }

  enable(): void {
    this.mmuMode = true;
  }

  detachIpl(): void {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
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

  reset(): void {
    for (let i = 0; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }

    this.tlbs.forEach((entry) => {
      entry.reset();
    });

    this.iplMode = false;
    this.mmuMode = false;
    this.errorAddr = 0;
    this.errorCause = 0;
    this.tlbMissPage = 0;
  }
}
