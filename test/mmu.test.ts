import { ipl } from '../src/renderer/TaC/ipl';
import { Mmu } from '../src/renderer/TaC/memory/mmu';

test('MMU Read/Write Test', () => {
  const mmu = new Mmu();

  mmu.write(0x1000, 10);
  expect(mmu.read(0x1000)).toBe(10);
  expect(mmu.read(0x2000)).toBe(0);

  mmu.write(0xa000, 0x1234);
  expect(mmu.read(0xa000)).toBe(0x1234);
});

test('MMU IPL loading Test', () => {
  const mmu = new Mmu();
  mmu.loadIpl();

  const f1 = (mmu: Mmu) => {
    for (let i = 0; i < ipl.length; i++) {
      if (mmu.read(0xe000 + i * 2) !== ipl[i]) {
        return false;
      }
    }
    return true;
  };

  expect(f1(mmu)).toBe(true);

  // 0xe000~0xffffがROMになっているかのテスト
  mmu.write(0xe000, 0x1234);
  expect(mmu.read(0xe000)).toBe(ipl[0]);
  mmu.write(0xfffe, 0x4321);
  expect(mmu.read(0xfffe)).toBe(0);

  mmu.detachIpl();
  expect(mmu.read(0xe000)).toBe(0);

  // 0xe000~0xffffがRAMになっているかのテスト
  mmu.write(0xe000, 0x1234);
  expect(mmu.read(0xe000)).toBe(0x1234);
  mmu.write(0xfffe, 0x4321);
  expect(mmu.read(0xfffe)).toBe(0x4321);
});
