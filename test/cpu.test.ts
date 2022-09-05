import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { PrivModeSignal } from '../src/renderer/TaC/cpu/privModeSignal';
import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Instruction } from '../src/renderer/TaC/cpu/instruction/instruction';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import { IIOHostController } from '../src/renderer/TaC/interface';
import { REGISTER_G0, REGISTER_G1, REGISTER_G2, REGISTER_FP } from '../src/renderer/TaC/cpu/register';

const io: IIOHostController = {
  input: (addr: number) => {
    return 0;
  },
  output: (addr: number, val: number) => {
    return;
  },
};

const intrController = new IntrController();
const privSig = new PrivModeSignal();
const mmu = new Mmu(new Memory(), intrController, privSig);
const cpu = new Cpu(mmu, intrController, io, privSig);

test('CPU instruction decode test', () => {
  /* LD G0, Addr */
  let inst: Instruction = cpu['decode'](0b0000100000000000);
  expect(inst.opcode).toBe(0b00001);
  expect(inst.addrMode).toBe(0);
  expect(inst.rd).toBe(0);
  expect(inst.rx).toBe(0);

  /* IN G5,%G10 */
  inst = cpu['decode'](0b1011011001011010);
  expect(inst.opcode).toBe(0b10110);
  expect(inst.addrMode).toBe(6);
  expect(inst.rd).toBe(5);
  expect(inst.rx).toBe(10);
});

test('Converting unsigned int4 to signed int4 Test', () => {
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

test('CPU effective address calclation test', () => {
  cpu['setPC'](0);

  /* ダイレクトモード */
  mmu.write16(0x0002, 0x1234);
  expect(cpu['calcEffectiveAddress'](0, REGISTER_G0)).toBe(0x1234);

  /* インデクスドモード */
  mmu.write16(0x0002, 0x2345);
  cpu['setRegister'](REGISTER_G1, 0x6543);
  expect(cpu['calcEffectiveAddress'](1, REGISTER_G1)).toBe(0x8888);

  /* FP相対モード */
  cpu['setRegister'](REGISTER_FP, 0x1000);
  expect(cpu['calcEffectiveAddress'](3, 0b0111)).toBe(0x1000 + 7 * 2);
  expect(cpu['calcEffectiveAddress'](3, 0b1000)).toBe(0x1000 - 8 * 2);

  /* レジスタ・インダイレクトモード */
  cpu['setRegister'](REGISTER_G1, 0x2222);
  expect(cpu['calcEffectiveAddress'](6, REGISTER_G1)).toBe(0x2222);

  /* バイトレジスタ・インダイレクトモード */
  cpu['setRegister'](REGISTER_G1, 0xaaaa);
  expect(cpu['calcEffectiveAddress'](7, REGISTER_G1)).toBe(0xaaaa);

  /* それ以外 */
  expect(cpu['calcEffectiveAddress'](2, 0)).toBe(0);

  mmu.write16(0x0002, 0);
  cpu['setRegister'](REGISTER_G1, 0);
  cpu['setRegister'](REGISTER_FP, 0);
});

test('CPU loading operand test', () => {
  cpu['setPC'](0);

  /* ダイレクトモード */
  mmu.write16(0x1000, 0x1234);
  expect(cpu['loadOperand'](0, 0, 0x1000)).toBe(0x1234);

  /* インデクスドモード */
  mmu.write16(0x2000, 0x1234);
  mmu.write16(0x2000 + 2, 0x4321);
  cpu['setRegister'](REGISTER_G1, 0x0002);
  expect(cpu['loadOperand'](1, REGISTER_G1, 0x2000)).toBe(0x4321);

  /* イミディエイトモード */
  cpu['setPC'](0x2000);
  mmu.write16(0x2000 + 2, 0x5555);
  expect(cpu['loadOperand'](2, 0, 0)).toBe(0x5555);

  /* レジスタレジスタモード */
  cpu['setRegister'](REGISTER_G2, 0xaaaa);
  expect(cpu['loadOperand'](4, REGISTER_G2, 0)).toBe(0xaaaa);

  /* ショートイミディエイトモード */
  expect(cpu['loadOperand'](5, 0b0111, 0)).toBe(7);
  expect(cpu['loadOperand'](5, 0b1000, 0)).toBe(-8);

  /* バイトレジスタ・インダイレクトモード */
  mmu.write16(0x2000, 0x5678);
  expect(cpu['loadOperand'](7, 0, 0x2001)).toBe(0x0078);

  mmu.write16(0x1000, 0);
  mmu.write16(0x2000, 0);
  mmu.write16(0x2000 + 2, 0);
  cpu['setRegister'](REGISTER_G2, 0);
});
