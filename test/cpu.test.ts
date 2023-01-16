import { Memory } from '../src/renderer/TaC/memory/memory';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Psw } from '../src/renderer/TaC/cpu/psw';
import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Register } from '../src/renderer/TaC/cpu/register';
import { Instruction } from '../src/renderer/TaC/cpu/instruction';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import { IIOHostController } from '../src/renderer/TaC/interface';
import * as regNum from '../src/renderer/TaC/cpu/const/regNum';

const io: IIOHostController = {
  input: (addr: number) => {
    return 0;
  },
  output: (addr: number, val: number) => {
    return;
  },
};

const intrController = new IntrController();
const psw = new Psw();
const mmu = new Mmu(new Memory(), intrController, psw);
const register = new Register(psw);
const cpu = new Cpu(mmu, register, psw, psw, intrController, io);

test('CPU instruction decode test', () => {
  /* LD G0, Addr */
  let inst: Instruction = cpu['decode'](0b0000100000000000);
  expect(inst.opcode).toBe(0b00001);
  expect(inst.addrMode).toBe(0);
  expect(inst.rd).toBe(0);
  expect(inst.rx).toBe(0);

  /* IN G5, %G10 */
  inst = cpu['decode'](0b1011011001011010);
  expect(inst.opcode).toBe(0b10110);
  expect(inst.addrMode).toBe(6);
  expect(inst.rd).toBe(5);
  expect(inst.rx).toBe(10);
});

test('Sign extension Test', () => {
  expect(cpu['extSignedInt4'](0b0000)).toBe(0b0000);
  expect(cpu['extSignedInt4'](0b0001)).toBe(0b0001);
  expect(cpu['extSignedInt4'](0b0010)).toBe(0b0010);
  expect(cpu['extSignedInt4'](0b0011)).toBe(0b0011);
  expect(cpu['extSignedInt4'](0b0100)).toBe(0b0100);
  expect(cpu['extSignedInt4'](0b0101)).toBe(0b0101);
  expect(cpu['extSignedInt4'](0b0110)).toBe(0b0110);
  expect(cpu['extSignedInt4'](0b0111)).toBe(0b0111);
  expect(cpu['extSignedInt4'](0b1000)).toBe(0xfff8);
  expect(cpu['extSignedInt4'](0b1001)).toBe(0xfff9);
  expect(cpu['extSignedInt4'](0b1010)).toBe(0xfffa);
  expect(cpu['extSignedInt4'](0b1011)).toBe(0xfffb);
  expect(cpu['extSignedInt4'](0b1100)).toBe(0xfffc);
  expect(cpu['extSignedInt4'](0b1101)).toBe(0xfffd);
  expect(cpu['extSignedInt4'](0b1110)).toBe(0xfffe);
  expect(cpu['extSignedInt4'](0b1111)).toBe(0xffff);
});

test('CPU effective address calclation test', () => {
  psw.jumpTo(0);

  /* ダイレクトモード */
  mmu.write16(0x0002, 0x1000);
  expect(cpu['calcEffectiveAddress'](0, regNum.G0)).toBe(0x1000);

  /* インデクスドモード */
  mmu.write16(0x0002, 0x2000);
  register.write(regNum.G1, 0x0002);
  expect(cpu['calcEffectiveAddress'](1, regNum.G1)).toBe(0x2002);

  /* FP相対モード */
  register.write(regNum.FP, 0x1000);
  expect(cpu['calcEffectiveAddress'](3, 0b0111)).toBe(0x1000 + 7 * 2);
  expect(cpu['calcEffectiveAddress'](3, 0b1000)).toBe(0x1000 - 8 * 2);

  /* レジスタ・インダイレクトモード */
  register.write(regNum.G1, 0x4000);
  expect(cpu['calcEffectiveAddress'](6, regNum.G1)).toBe(0x4000);

  /* バイトレジスタ・インダイレクトモード */
  register.write(regNum.G1, 0x5001);
  expect(cpu['calcEffectiveAddress'](7, regNum.G1)).toBe(0x5001);

  /* それ以外 */
  expect(cpu['calcEffectiveAddress'](2, 0)).toBe(0);
});

test('CPU loading operand test', () => {
  psw.jumpTo(0);

  /* ダイレクトモード */
  mmu.write16(0x1000, 1);
  expect(cpu['loadOperand'](0, 0, 0x1000)).toBe(1);

  /* インデクスドモード */
  mmu.write16(0x2000, 2);
  expect(cpu['loadOperand'](1, 0, 0x2000)).toBe(2);

  /* イミディエイトモード */
  psw.jumpTo(0x3000);
  mmu.write16(0x3000 + 2, 3);
  expect(cpu['loadOperand'](2, 0, 0)).toBe(3);

  /* FP相対モード */
  mmu.write16(0x4000, 4);
  expect(cpu['loadOperand'](3, 0, 0x4000)).toBe(4);

  /* レジスタレジスタモード */
  register.write(regNum.G2, 5);
  expect(cpu['loadOperand'](4, regNum.G2, 0)).toBe(5);

  /* ショートイミディエイトモード */
  expect(cpu['loadOperand'](5, 0b0111, 0)).toBe(7);
  expect(cpu['loadOperand'](5, 0b1000, 0)).toBe(0xfff8);

  /* レジスタ・インダイレクトモード */
  mmu.write16(0x5000, 0x1234);
  expect(cpu['loadOperand'](6, 0, 0x5000)).toBe(0x1234);

  /* バイトレジスタ・インダイレクトモード */
  mmu.write16(0x2000, 0x1234);
  expect(cpu['loadOperand'](7, 0, 0x2000)).toBe(0x0012);
  expect(cpu['loadOperand'](7, 0, 0x2001)).toBe(0x0034);
});
