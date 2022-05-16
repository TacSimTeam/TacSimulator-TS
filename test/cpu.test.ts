import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { REGISTER_FP, REGISTER_G2, REGISTER_G3 } from '../src/renderer/TaC/cpu/register';

test('CPU decode Test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  const inst = cpu['decode'](0b0010000110100101);
  expect(inst.op).toBe(0b00100);
  expect(inst.addrMode).toBe(0b001);
  expect(inst.rd).toBe(0b1010);
  expect(inst.rx).toBe(0b0101);
  expect(inst.dsp).toBe(0);
});

test('Converting unsigned int4 to signed int4', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  expect(cpu['convSignedInt4'](0b0000)).toBe(0);
  expect(cpu['convSignedInt4'](0b0001)).toBe(1);
  expect(cpu['convSignedInt4'](0b0010)).toBe(2);
  expect(cpu['convSignedInt4'](0b0011)).toBe(3);
  expect(cpu['convSignedInt4'](0b0100)).toBe(4);
  expect(cpu['convSignedInt4'](0b0101)).toBe(5);
  expect(cpu['convSignedInt4'](0b0110)).toBe(6);
  expect(cpu['convSignedInt4'](0b0111)).toBe(7);
  expect(cpu['convSignedInt4'](0b1000)).toBe(-8);
  expect(cpu['convSignedInt4'](0b1001)).toBe(-7);
  expect(cpu['convSignedInt4'](0b1010)).toBe(-6);
  expect(cpu['convSignedInt4'](0b1011)).toBe(-5);
  expect(cpu['convSignedInt4'](0b1100)).toBe(-4);
  expect(cpu['convSignedInt4'](0b1101)).toBe(-3);
  expect(cpu['convSignedInt4'](0b1110)).toBe(-2);
  expect(cpu['convSignedInt4'](0b1111)).toBe(-1);
});

test('CPU effective address calculation', () => {
  const mmu = new Mmu(new Memory());
  const cpu = new Cpu(mmu);

  /* LD G3,0x1234 */
  cpu['setPC'](2);
  mmu.write16(0x0000, 0b0000100001100000); // Addr : 0x0000
  mmu.write16(0x0002, 0b0001001000110100); // Addr : 0x0002
  expect(cpu['calcEffectiveAddress'](0, REGISTER_G3)).toBe(0x1234);

  /* LD G1,0x1234,G2(5) */
  cpu['setPC'](6);
  mmu.write16(0x0004, 0b0000100100010010); // Addr : 0x0004
  mmu.write16(0x0006, 0b0001001000110100); // Addr : 0x0006
  cpu['setRegister'](REGISTER_G2, 5);
  expect(cpu['calcEffectiveAddress'](1, REGISTER_G2)).toBe(0x1234 + 5);

  /* LD SP,#0x1234 */
  cpu['setPC'](10);
  mmu.write16(0x0008, 0b0000101011010000); // Addr : 0x0008
  mmu.write16(0x000a, 0b0001001000110100); // Addr : 0x000a
  expect(cpu['calcEffectiveAddress'](2, REGISTER_G2)).toBe(0);

  /* LD Rd,-4(-2*2),FP (FP相対は1ワード命令) */
  cpu['setPC'](12);
  mmu.write16(0x000c, 0b0000101100111110); // Addr : 0x000c
  cpu['setRegister'](REGISTER_FP, 0x1234);
  expect(cpu['calcEffectiveAddress'](3, 0b1110)).toBe(0x1234 - 4);
});
