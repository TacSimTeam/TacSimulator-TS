import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';

test('CPU decode Test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  const inst = cpu['decode'](0b0010000110100101);
  expect(inst.op).toBe(0b00100);
  expect(inst.addrMode).toBe(0b001);
  expect(inst.rd).toBe(0b1010);
  expect(inst.rx).toBe(0b0101);
  expect(inst.dsp).toBe(0);
});
