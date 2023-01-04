import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Psw } from '../src/renderer/TaC/cpu/psw';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import * as intr from '../src/renderer/TaC/interrupt/interruptKind';

test('Memory read/write test', () => {
  const memory = new Memory();

  memory.write16(0x1000, 1);
  expect(memory.read16(0x1000)).toBe(1);
  expect(memory.read16(0x2000)).toBe(0);

  memory.write16(0x3000, 0x1234);
  expect(memory.read8(0x3000 + 0)).toBe(0x0012);
  expect(memory.read8(0x3000 + 1)).toBe(0x0034);
  memory.write8(0x3000 + 1, 0x00);
  expect(memory.read16(0x3000)).toBe(0x1200);
});

test('IPL loading test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);

  mmu.loadIpl();

  /* 0xe000~0xffffがROMになっているか */
  expect(() => {
    mmu.write16(0xe000, 1);
  }).toThrowError();
  expect(() => {
    mmu.write16(0xfffe, 1);
  }).toThrowError();

  mmu.detachIpl();

  expect(mmu.read16(0xe000)).toBe(0);
  expect(mmu.read16(0xfffe)).toBe(0);

  /* IPL切り離し後, 0xe000~0xffffがRAMになっているか */
  mmu.write16(0xe000, 1);
  expect(mmu.read16(0xe000)).toBe(1);
  mmu.write16(0xfffe, 1);
  expect(mmu.read16(0xfffe)).toBe(1);
});

test('Setting TLB entries test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);

  /* TLBエントリの設定が正しくできるか */
  mmu.setTlbHigh8(1, 0xff);
  mmu.setTlbLow16(1, 0xffff);
  expect(mmu.getTlbHigh8(1)).toBe(0x00ff);
  expect(mmu.getTlbLow16(1)).toBe(0xffff);
});

test('MMU read 1byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);
  psw.setPrivFlag(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  memory.write8(0x5511, 1);
  expect(mmu.read8(0x1011)).toBe(1); /* p : 0x10 -> f : 0x55 */

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x07aa); /* Frame : 0xaa, Invalid, RWX = 1 */
  memory.write8(0xaa33, 2);

  expect(() => {
    mmu.read8(0x2033); /* p : 0x20 -> f : 0xaa(ただしエラーになる) */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.read8(0x3055); /* p : 0x30(存在しない) -> ? */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Readフラグが0) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x8399); /* Frame : 0x99, Valid, R = 0, WX = 1 */

  memory.write8(0x9977, 3);
  expect(mmu.read8(0x4077)).not.toBe(3); /* p : 0x40 -> f : 0x99(ただしR=0なので読めない) */
  expect(mmu.getErrorAddr()).toBe(0x4077);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  psw.setPrivFlag(true);

  mmu.setTlbHigh8(0, 0x50); /* Page : 0x50 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  memory.write8(0x5599, 4);
  expect(mmu.read8(0x5099)).not.toBe(4); /* p : 0x50 -> f : 0x55(MMU無効) */
});

test('MMU read 2byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);
  psw.setPrivFlag(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  memory.write16(0x5500, 1);
  expect(mmu.read16(0x1000)).toBe(1); /* p : 0x10 -> f : 0x55 */

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x07aa); /* Frame : 0xaa, Invalid, RWX = 1 */
  memory.write16(0xaa44, 2);

  expect(() => {
    mmu.read16(0x2044); /* p : 0x20 -> f : 0xaa(ただしエラーになる) */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.read16(0x3066); /* p : 0x30(存在しない) -> ? */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Readフラグが0) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x8399); /* Frame : 0x99, Valid, R = 0, WX = 1 */

  memory.write16(0x9988, 3);
  expect(mmu.read16(0x4088)).not.toBe(3); /* p : 0x40 -> f : 0x99(ただしR=0なので読めない) */
  expect(mmu.getErrorAddr()).toBe(0x4088);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* メモリ保護違反(奇数アドレス) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x87aa); /* Frame : 0xaa, Valid, RWX = 1 */

  memory.write8(0x4001, 0x12);
  memory.write8(0x4002, 0x34);
  expect(mmu.read16(0x4001)).not.toBe(0x1234); /* 奇数アドレスなので読めない */
  expect(mmu.getErrorAddr()).toBe(0x4001);
  expect(mmu.getErrorCause()).toBe(2);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  psw.setPrivFlag(true);

  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  memory.write16(0x5522, 4);
  expect(mmu.read16(0x1022)).not.toBe(4); /* p : 0x10 -> f : 0x55 */
});

test('MMU write 1byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);
  psw.setPrivFlag(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  mmu.write8(0x1011, 1); /* p : 0x10 -> f : 0x55 */
  expect(memory.read8(0x5511)).toBe(1);

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x07aa); /* Frame : 0xaa, Invalid, RWX = 1 */

  expect(() => {
    mmu.write8(0x2033, 2); /* p : 0x20 -> f : 0xaa(ただしエラーになる) */
  }).toThrowError('TLB miss error');
  expect(memory.read8(0xaa33)).not.toBe(2);
  expect(mmu.getErrorPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.write8(0x3055, 3); /* p : 0x30(存在しない) -> ? */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Writeフラグが0) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x8599); /* Frame : 0x99, Valid, RX = 1, W = 0 */

  mmu.write8(0x4077, 4); /* p : 0x40 -> f : 0x99(ただしR=0なので書けない) */
  expect(memory.read16(0x9977)).not.toBe(4);
  expect(mmu.getErrorAddr()).toBe(0x4077);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  psw.setPrivFlag(true);

  mmu.setTlbHigh8(0, 0x50); /* Page : 0x50 */
  mmu.setTlbLow16(0, 0x87cc); /* Frame : 0xcc, Valid, RWX = 1 */

  mmu.write8(0x5099, 5);
  expect(mmu.read8(0x5099)).toBe(5);
  expect(mmu.read8(0xcc99)).not.toBe(5);
});

test('MMU write 2byte data test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);
  psw.setPrivFlag(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  mmu.write16(0x1022, 1); /* p : 0x10 -> f : 0x55 */
  expect(memory.read16(0x5522)).toBe(1);

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x07aa); /* Frame : 0xaa, Invalid, RWX = 1 */

  expect(() => {
    mmu.write16(0x2044, 2); /* p : 0x20 -> f : 0xaa(ただしエラーになる) */
  }).toThrowError('TLB miss error');
  expect(memory.read16(0xaa44)).not.toBe(2);
  expect(mmu.getErrorPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.write16(0x3066, 3); /* p : 0x30(存在しない) -> ? */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Writeフラグが0) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x8599); /* Frame : 0x99, Valid, RX = 1, W = 0 */

  mmu.write16(0x4088, 4); /* p : 0x40 -> f : 0x99(ただしR=0なので書けない) */
  expect(memory.read16(0x9988)).not.toBe(4);
  expect(mmu.getErrorAddr()).toBe(0x4088);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* メモリ保護違反(奇数アドレス) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x87aa); /* Frame : 0xaa, Valid, RWX = 1 */

  mmu.write16(0x4001, 0x12);
  mmu.write16(0x4002, 0x34);
  expect(memory.read16(0xaa01)).not.toBe(0x1234); /* 奇数アドレスなので書けない */
  expect(mmu.getErrorAddr()).toBe(0x4001);
  expect(mmu.getErrorCause()).toBe(2);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);

  /* MMUが有効でも特権モードのときはp-f変換しない */
  psw.setPrivFlag(true);

  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  mmu.write16(0x1022, 5);
  expect(mmu.read16(0x1022)).toBe(5);
  expect(mmu.read16(0x5522)).not.toBe(5);
});

test('MMU instruction fetch test', () => {
  const memory = new Memory();
  const intrController = new IntrController();
  const psw = new Psw();
  const mmu = new Mmu(memory, intrController, psw);
  psw.setPrivFlag(false);
  mmu.enable();

  /* 正常な動作 */
  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  memory.write16(0x5500, 1);
  expect(mmu.fetch(0x1000)).toBe(1); /* p : 0x10 -> f : 0x55 */

  /* Validフラグが0のときTLBミスになる */
  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x07aa); /* Frame : 0xaa, Invalid, RWX = 1 */
  memory.write16(0xaa44, 2);

  expect(() => {
    mmu.fetch(0x2044); /* p : 0x20 -> f : 0xaa(ただしエラーになる) */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x20);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* TLBエントリが存在しないときTLBミスになる */
  expect(() => {
    mmu.fetch(0x3066); /* p : 0x30(存在しない) -> ? */
  }).toThrowError('TLB miss error');
  expect(mmu.getErrorPage()).toBe(0x30);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_TLB_MISS);

  /* メモリ保護違反(Executeフラグが0) */
  mmu.setTlbHigh8(0, 0x40); /* Page : 0x40 */
  mmu.setTlbLow16(0, 0x8699); /* Frame : 0x99, Valid, RW = 1, X = 0 */

  memory.write16(0x9988, 3);
  expect(mmu.fetch(0x4088)).not.toBe(3); /* p : 0x40 -> f : 0x99(ただしR=0なので読めない) */
  expect(mmu.getErrorAddr()).toBe(0x4088);
  expect(mmu.getErrorCause()).toBe(1);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_MEMORY_ERROR);
});
