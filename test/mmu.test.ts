import { ipl } from '../src/renderer/TaC/ipl';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';

test('MMU Read/Write Test', () => {
  const memory = new Memory();
  const mmu = new Mmu(memory);

  mmu.write16(0x1000, 10);
  expect(mmu.read16(0x1000)).toBe(10);
  expect(mmu.read16(0x2000)).toBe(0);

  mmu.write16(0xa000, 0x1234);
  expect(mmu.read16(0xa000)).toBe(0x1234);
});

test('MMU IPL loading Test', () => {
  const memory = new Memory();
  const mmu = new Mmu(memory);
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
