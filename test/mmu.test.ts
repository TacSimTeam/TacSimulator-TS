import { ipl } from '../src/renderer/TaC/ipl';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { PrivModeSignal } from '../src/renderer/TaC/cpu/privModeSignal';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';

test('Memory Read/Write Test', () => {
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

test('MMU Read/Write Test', () => {
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

test('MMU IPL loading Test', () => {
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

  // 0xe000~0xffffがROMになっているかのテスト
  mmu.write16(0xe000, 0x1234);
  expect(mmu.read16(0xe000)).toBe(ipl[0]);
  mmu.write16(0xfffe, 0x4321);
  expect(mmu.read16(0xfffe)).toBe(0);

  mmu.detachIpl();
  expect(mmu.read16(0xe000)).toBe(0);

  // 0xe000~0xffffがRAMになっているかのテスト
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

  privSig.setPrivMode(true);
  mmu.enableMmu();

  mmu.setTlbHigh8(0, 0x10); /* Page : 0x10 */
  mmu.setTlbLow16(0, 0x8755); /* Frame : 0x55, Valid, RWX = 1 */

  mmu.setTlbHigh8(1, 0x20); /* Page : 0x20 */
  mmu.setTlbLow16(1, 0x87aa); /* Frame : 0xaa, Valid, RWX = 1 */

  memory.write16(0x5522, 0x1234);
  memory.write16(0xaa44, 0x4321);

  expect(mmu.read16(0x1022)).toBe(0x1234);
  expect(mmu.read16(0x2044)).toBe(0x4321);
});
