import { ipl } from '../src/renderer/TaC/ipl';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { PrivModeSignal } from '../src/renderer/TaC/cpu/privModeSignal';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import * as intr from '../src/renderer/TaC/interrupt/interruptNum';

test('Memory read/write test', () => {
  const memory = new Memory();

  memory.write16(0x1000, 0x1234);
  expect(memory.read16(0x1000)).toBe(0x1234);
  expect(memory.read16(0x2000)).toBe(0);

  memory.write16(0x3000, 0x5678);
  expect(memory.read8(0x3000 + 0)).toBe(0x0056);
  expect(memory.read8(0x3000 + 1)).toBe(0x0078);
  memory.write8(0x3000 + 1, 0x00);
  expect(memory.read16(0x3000)).toBe(0x5600);
});

test('IPL loading test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  mmu.loadIpl();

  /* IPLが正常に読み込まれているか */
  const f1 = (memory: Memory) => {
    for (let i = 0; i < ipl.length; i++) {
      if (memory.read16(0xe000 + i * 2) !== ipl[i]) {
        return false;
      }
    }
    return true;
  };
  expect(f1(memory)).toBe(true);

  /* 0xe000~0xffffがROMになっているか */
  expect(() => {
    mmu.write16(0xe000, 0x1234);
  }).toThrowError();
  expect(() => {
    mmu.write16(0xfffe, 0x4321);
  }).toThrowError();

  /* IPL切り離しテスト */
  mmu.detachIpl();
  expect(mmu.read16(0xe000)).toBe(0);
  expect(mmu.read16(0xfffe)).toBe(0);

  /* IPL切り離し後, 0xe000~0xffffがRAMになっているか */
  mmu.write16(0xe000, 0x1234);
  expect(mmu.read16(0xe000)).toBe(0x1234);
  mmu.write16(0xfffe, 0x4321);
  expect(mmu.read16(0xfffe)).toBe(0x4321);
});

test('Setting TLB entries test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);

  /* TLBエントリの設定が正しくできるか */
  mmu.setTlbHigh8(1, 0xff);
  mmu.setTlbLow16(1, 0xffff);
  expect(mmu.getTlbHigh8(1)).toBe(0x00ff);
  expect(mmu.getTlbLow16(1)).toBe(0xffff);
});

test('MMU read 1byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  privSig.setPrivMode(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  memory.write8(0x5511, 0x22);
  expect(mmu.read8(0x1011)).toBe(0x22); // p : 0x10 -> f : 0x55

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x07aa); // Frame : 0xaa, Invalid, RWX = 1
  memory.write8(0xaa33, 0x44);

  expect(() => {
    mmu.read8(0x2033); // p : 0x20 -> f : 0xaa(ただしエラーになるはず)
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.read8(0x3055); // p : 0x30(存在しない) -> ?
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Readフラグが0) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x8399); // Frame : 0x99, Valid, R = 0, WX = 1

  memory.write8(0x9977, 0x55);
  expect(mmu.read8(0x4077)).toBe(0); // p : 0x40 -> f : 0x99(ただしR=0なので読めない)
  expect(mmu.getErrorAddr()).toBe(0x4077);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  privSig.setPrivMode(true);

  mmu.setTlbHigh8(0, 0x50); // Page : 0x50
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  memory.write8(0x5599, 0x77);
  expect(mmu.read8(0x5099)).not.toBe(0x77); // p : 0x50 -> f : 0x55
});

test('MMU read 2byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  privSig.setPrivMode(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  memory.write16(0x5500, 0x1111);
  expect(mmu.read16(0x1000)).toBe(0x1111); // p : 0x10 -> f : 0x55

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x07aa); // Frame : 0xaa, Invalid, RWX = 1
  memory.write16(0xaa44, 0x2222);

  expect(() => {
    mmu.read16(0x2044); // p : 0x20 -> f : 0xaa(ただしエラーになるはず)
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.read16(0x3066); // p : 0x30(存在しない) -> ?
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Readフラグが0) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x8399); // Frame : 0x99, Valid, R = 0, WX = 1

  memory.write16(0x9988, 0x3333);
  expect(mmu.read16(0x4088)).toBe(0); // p : 0x40 -> f : 0x99(ただしR=0なので読めない)
  expect(mmu.getErrorAddr()).toBe(0x4088);
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

test('MMU write 1byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  privSig.setPrivMode(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  mmu.write8(0x1011, 0x22); // p : 0x10 -> f : 0x55
  expect(memory.read8(0x5511)).toBe(0x22);

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x07aa); // Frame : 0xaa, Invalid, RWX = 1

  expect(() => {
    mmu.write8(0x2033, 0x44); // p : 0x20 -> f : 0xaa(ただしエラーになるはず)
  }).toThrowError('TLB miss error');
  expect(memory.read8(0xaa33)).not.toBe(0x44);
  expect(mmu.getTlbMissPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.write8(0x3055, 0x66); // p : 0x30(存在しない) -> ?
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Writeフラグが0) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x8599); // Frame : 0x99, Valid, RX = 1, W = 0

  mmu.write8(0x4077, 0x88); // p : 0x40 -> f : 0x99(ただしR=0なので書けない)
  expect(memory.read16(0x9977)).not.toBe(0x66);
  expect(mmu.getErrorAddr()).toBe(0x4077);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  privSig.setPrivMode(true);

  mmu.setTlbHigh8(0, 0x50); // Page : 0x50
  mmu.setTlbLow16(0, 0x87cc); // Frame : 0xcc, Valid, RWX = 1

  mmu.write8(0x5099, 0xaa);
  expect(mmu.read8(0x5099)).toBe(0xaa);
  expect(mmu.read8(0xcc99)).not.toBe(0xaa);
});

test('MMU write 2byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const privSig = new PrivModeSignal();
  const mmu = new Mmu(memory, intrController, privSig);
  privSig.setPrivMode(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  mmu.write16(0x1022, 0x1111); // p : 0x10 -> f : 0x55
  expect(memory.read16(0x5522)).toBe(0x1111);

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); // Page : 0x20
  mmu.setTlbLow16(1, 0x07aa); // Frame : 0xaa, Invalid, RWX = 1

  expect(() => {
    mmu.write16(0x2044, 0x2222); // p : 0x20 -> f : 0xaa(ただしエラーになるはず)
  }).toThrowError('TLB miss error');
  expect(memory.read16(0xaa44)).not.toBe(0x2222);
  expect(mmu.getTlbMissPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.write16(0x3066, 0x3333); // p : 0x30(存在しない) -> ?
  }).toThrowError('TLB miss error');
  expect(mmu.getTlbMissPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Writeフラグが0) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x8599); // Frame : 0x99, Valid, RX = 1, W = 0

  mmu.write16(0x4088, 0x4444); // p : 0x40 -> f : 0x99(ただしR=0なので書けない)
  expect(memory.read16(0x9988)).not.toBe(0x4444);
  expect(mmu.getErrorAddr()).toBe(0x4088);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* メモリ保護違反(奇数アドレス) */
  mmu.setTlbHigh8(0, 0x40); // Page : 0x40
  mmu.setTlbLow16(0, 0x87aa); // Frame : 0xaa, Valid, RWX = 1

  mmu.write16(0x4001, 0x5678); // 奇数アドレスなので書けない
  expect(memory.read16(0xaa01)).not.toBe(0x5678);
  expect(mmu.getErrorAddr()).toBe(0x4001);
  expect(mmu.getErrorCause()).toBe(2);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  privSig.setPrivMode(true);

  mmu.setTlbHigh8(0, 0x10); // Page : 0x10
  mmu.setTlbLow16(0, 0x8755); // Frame : 0x55, Valid, RWX = 1

  mmu.write16(0x1022, 0x1234);
  expect(mmu.read16(0x1022)).toBe(0x1234);
});
