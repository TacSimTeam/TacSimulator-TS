import { ipl } from '../src/renderer/TaC/ipl';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { PrivModeSignal } from '../src/renderer/TaC/cpu/privModeSignal';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import * as intr from '../src/renderer/TaC/interrupt/interruptNum';

test('Memory read/write test', () => {
  const memory = new Memory();

  memory.write16(0x1000, 10);
  expect(memory.read16(0x1000)).toBe(10);
  expect(memory.read16(0x2000)).toBe(0);

  memory.write16(0xa000, 0x1234);
  expect(memory.read16(0xa000)).toBe(0x1234);

  memory.write16(0x4000, 0x5678);
  expect(memory.read8(0x4000 + 0)).toBe(0x0056);
  expect(memory.read8(0x4000 + 1)).toBe(0x0078);

  memory.write8(0x4000 + 1, 0x00);
  expect(memory.read16(0x4000)).toBe(0x5600);

  expect(memory.getMemorySize()).toBe(64 * 1024);
});

test('MMU read/write test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);

  mmu.write16(0x1000, 10);
  expect(mmu.read16(0x1000)).toBe(10);
  expect(mmu.read16(0x2000)).toBe(0);

  mmu.write16(0xa000, 0x1234);
  expect(mmu.read16(0xa000)).toBe(0x1234);

  mmu.write16(0x4000, 0x5678);
  expect(mmu.read8(0x4000 + 0)).toBe(0x0056);
  expect(mmu.read8(0x4000 + 1)).toBe(0x0078);

  mmu.write8(0x4000 + 1, 0x00);
  expect(mmu.read16(0x4000)).toBe(0x5600);
});

test('IPL loading Test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  mmu.loadIpl();

  const f1 = (mmu: Mmu) => {
    for (let i = 0; i < ipl.length; i++) {
      if (mmu.read16(0xe000 + i * 2) !== ipl[i]) {
        return false;
      }
    }
    return true;
  };

  expect(f1(mmu)).toBe(true);

  /* 0xe000~0xffffがROMになっているかのテスト */
  expect(() => {
    mmu.write16(0xe000, 0x1234);
  }).toThrowError();
  expect(() => {
    mmu.write16(0xfffe, 0x4321);
  }).toThrowError();

  mmu.detachIpl();
  expect(mmu.read16(0xe000)).toBe(0);

  /* 0xe000~0xffffがRAMになっているかのテスト */
  mmu.write16(0xe000, 0x1234);
  expect(mmu.read16(0xe000)).toBe(0x1234);
  mmu.write16(0xfffe, 0x4321);
  expect(mmu.read16(0xfffe)).toBe(0x4321);
});

test('MMU p-f conversion test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  mmu.enable();

  privSig.setPrivMode(false);

  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x87aa); // Frame : 0xaa, Valid, RWX = 1

  memory.write16(0x5522, 0x1234);
  memory.write16(0xaa44, 0x4321);

  expect(mmu.read16(0x1022)).toBe(0x1234); // p : 0x10 -> f : 0x55
  expect(mmu.read16(0x2044)).toBe(0x4321); // p : 0x20 -> f : 0xaa

  /* 特権モードのときp-f変換は行わない */
  privSig.setPrivMode(true);

  memory.write16(0x1022, 0x6666);
  memory.write16(0x2044, 0x7777);

  expect(mmu.read16(0x1022)).toBe(0x6666);
  expect(mmu.read16(0x2044)).toBe(0x7777);
});

test('MMU read test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  privSig.setPrivMode(false);

  /* MMU無効の場合 */
  memory.write16(0x1000, 10);
  expect(mmu.read16(0x1000)).toBe(10);

  /* MMU有効の場合 */
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  memory.write16(0x5522, 0x1234);
  expect(mmu.read16(0x1022)).toBe(0x1234); // p : 0x10 -> f : 0x55

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x07aa); // Frame : 0xaa, Invalid, RWX = 1
  memory.write16(0xaa44, 0x1234);

  expect(() => {
    mmu.read16(0x2044); // p : 0x20 -> f : 0xaa(ただしエラーになるはず)
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.read16(0xff66); // p : 0xff(存在しない) -> ?
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0xff);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Readフラグが0) */
  mmu.setTlbHigh8(0, 0x30); // Page : 0x30
  mmu.setTlbLow16(0, 0x8399); // Frame : 0x99, Valid, R = 0, WX = 1

  memory.write16(0x9988, 0x1234);
  expect(mmu.read16(0x3088)).toBe(0); // p : 0x30 -> f : 0x99(ただしR=0なので読めない)
  expect(mmu.getErrorAddr()).toBe(0x3088);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* メモリ保護違反(奇数アドレス) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x87aa); // Frame : 0xaa, Valid, RWX = 1

  expect(mmu.read16(0x4001)).toBe(0); // 奇数アドレスなので読めない
  expect(mmu.getErrorAddr()).toBe(0x4001);
  expect(mmu.getErrorCause()).toBe(2);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  privSig.setPrivMode(true);

  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  memory.write16(0x5522, 0x1234);
  expect(mmu.read16(0x1022)).not.toBe(0x1234); // p : 0x10 -> f : 0x55
});
