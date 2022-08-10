import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { REGISTER_FP, REGISTER_G2, REGISTER_G10, REGISTER_G11 } from '../src/renderer/TaC/cpu/register';

test('CPU utility Test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  cpu['setPC'](0x0002);
  cpu['nextPC']();
  expect(cpu['getPC']()).toBe(0x0004);

  expect(cpu['isTwoWordInstruction'](-1)).toBe(false);
  expect(cpu['isTwoWordInstruction'](0)).toBe(true);
  expect(cpu['isTwoWordInstruction'](2)).toBe(true);
  expect(cpu['isTwoWordInstruction'](3)).toBe(false);
});

test('CPU decode Test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  const inst = cpu['decode'](0b0010000110100101);
  expect(inst.opcode).toBe(0b00100);
  expect(inst.addrMode).toBe(0b001);
  expect(inst.rd).toBe(0b1010);
  expect(inst.rx).toBe(0b0101);
  expect(inst.dsp).toBe(0);
});

test('Converting unsigned int4 to signed int4 Test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

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

test('CPU effective address calculation Test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  /* Direct */
  mmu.write16(0x0000, 0x1234);
  expect(cpu['calcEffectiveAddress'](0, 0)).toBe(0x1234);

  /* Indexed */
  mmu.write16(0x0000, 0x3456);
  cpu['setRegister'](REGISTER_G2, 6);
  expect(cpu['calcEffectiveAddress'](1, REGISTER_G2)).toBe(0x3456 + 6);

  /* FP relative */
  cpu['setRegister'](REGISTER_FP, 0x1234);
  expect(cpu['calcEffectiveAddress'](3, 0b1110)).toBe(0x1234 + cpu['convSignedInt4'](0b1110) * 2);

  /* Register indirect */
  cpu['setRegister'](REGISTER_G10, 0x2000);
  expect(cpu['calcEffectiveAddress'](6, REGISTER_G10)).toBe(0x2000);

  /* Byte register indirect */
  cpu['setRegister'](REGISTER_G11, 0xfffe);
  expect(cpu['calcEffectiveAddress'](7, REGISTER_G11)).toBe(0xfffe);

  /* Otherwise */
  expect(cpu['calcEffectiveAddress'](2, 0)).toBe(0);
  expect(cpu['calcEffectiveAddress'](4, 0)).toBe(0);
  expect(cpu['calcEffectiveAddress'](5, 0)).toBe(0);
});

test('CPU loading operand Test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  /* Direct */
  mmu.write16(0x3210, 0x1234);
  expect(cpu['loadOperand'](0, 0, 0x3210)).toBe(0x1234);

  /* Indexed */
  mmu.write16(0x5678 + 0x0002, 0x7654);
  cpu['setRegister'](REGISTER_G2, 0x0002);
  expect(cpu['loadOperand'](1, REGISTER_G2, 0x5678)).toBe(0x7654);

  /* Immediate */
  cpu['setPC'](0);
  mmu.write16(0, 0x2525);
  expect(cpu['loadOperand'](2, 0, 0)).toBe(0x2525);

  /* FP Relative Mode */
  mmu.write16(0x5432, 0x9999);
  expect(cpu['loadOperand'](3, 0, 0x5432)).toBe(0x9999);

  /* Register to Register Mode */
  cpu['setRegister'](REGISTER_G10, 0x5555);
  expect(cpu['loadOperand'](4, REGISTER_G10, 0)).toBe(0x5555);

  /* Short Immediate Mode */
  expect(cpu['loadOperand'](5, 0b1011, 0)).toBe(cpu['convSignedInt4'](0b1011));

  /* Register Indirect Mode */
  mmu.write16(0x8000, 0x1111);
  expect(cpu['loadOperand'](6, 0, 0x8000)).toBe(0x1111);

  /* Register Indirect Mode */
  mmu.write16(0xa000, 0xabcd);
  expect(cpu['loadOperand'](7, 0, 0xa000 + 0)).toBe(0xab);
  expect(cpu['loadOperand'](7, 0, 0xa000 + 1)).toBe(0xcd);

  /* otherwise */
  expect(() => {
    cpu['loadOperand'](-1, 0, 0);
  }).toThrowError('不正なアドレッシングモードエラー');
  expect(() => {
    cpu['loadOperand'](8, 0, 0);
  }).toThrowError('不正なアドレッシングモードエラー');
});
