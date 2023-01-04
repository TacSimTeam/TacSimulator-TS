import { Alu } from '../src/renderer/TaC/cpu/alu';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';
import * as intr from '../src/renderer/TaC/interrupt/interruptKind';
import * as opcode from '../src/renderer/TaC/cpu/const/opcode';

test('Alu calculation test', () => {
  const intrController = new IntrController();
  const alu = new Alu(intrController);

  expect(alu.calc(opcode.ADD, 0x0001, 0x0001) & 0xffff).toBe(0x0002);
  expect(alu.calc(opcode.ADD, 0x0001, 0xffff) & 0xffff).toBe(0x0000);
  expect(alu.calc(opcode.ADD, 0xffff, 0xffff) & 0xffff).toBe(0xfffe);

  expect(alu.calc(opcode.SUB, 0x0001, 0x0001) & 0xffff).toBe(0x0000);
  expect(alu.calc(opcode.SUB, 0x0002, 0x0001) & 0xffff).toBe(0x0001);
  expect(alu.calc(opcode.SUB, 0x0001, 0x0002) & 0xffff).toBe(0xffff);
  expect(alu.calc(opcode.SUB, 0x0001, 0xffff) & 0xffff).toBe(0x0002);
  expect(alu.calc(opcode.SUB, 0xfffe, 0xffff) & 0xffff).toBe(0xffff);

  expect(alu.calc(opcode.CMP, 0x0001, 0x0001) & 0xffff).toBe(0x0000);
  expect(alu.calc(opcode.CMP, 0x0002, 0x0001) & 0xffff).toBe(0x0001);
  expect(alu.calc(opcode.CMP, 0x0001, 0x0002) & 0xffff).toBe(0xffff);
  expect(alu.calc(opcode.CMP, 0x0001, 0xffff) & 0xffff).toBe(0x0002);
  expect(alu.calc(opcode.CMP, 0xfffe, 0xffff) & 0xffff).toBe(0xffff);

  expect(alu.calc(opcode.AND, 0x00ff, 0x1234) & 0xffff).toBe(0x0034);
  expect(alu.calc(opcode.AND, 0x0000, 0xffff) & 0xffff).toBe(0x0000);

  expect(alu.calc(opcode.OR, 0x00ff, 0x1234) & 0xffff).toBe(0x12ff);
  expect(alu.calc(opcode.OR, 0x0000, 0xffff) & 0xffff).toBe(0xffff);

  expect(alu.calc(opcode.XOR, 0x5555, 0xffff) & 0xffff).toBe(0xaaaa);
  expect(alu.calc(opcode.XOR, 0x5555, 0x0000) & 0xffff).toBe(0x5555);

  expect(alu.calc(opcode.ADDS, 0x0002, 0x0001) & 0xffff).toBe(0x0004);
  expect(alu.calc(opcode.ADDS, 0x0002, 0xffff) & 0xffff).toBe(0x0000);

  expect(alu.calc(opcode.MUL, 0x0003, 0x0004) & 0xffff).toBe(0x000c);
  expect(alu.calc(opcode.MUL, 0xffff, 0x0001) & 0xffff).toBe(0xffff);

  expect(alu.calc(opcode.DIV, 0x0008, 0x0002) & 0xffff).toBe(0x0004);
  expect(alu.calc(opcode.DIV, 0x0009, 0x0002) & 0xffff).toBe(0x0004);
  expect(alu.calc(opcode.DIV, 0x0001, 0x0002) & 0xffff).toBe(0x0000);

  expect(alu.calc(opcode.DIV, 0x0001, 0x0000) & 0xffff).toBe(0x0000);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_ZERO_DIV); /* 0除算例外の確認 */

  expect(alu.calc(opcode.MOD, 0x0008, 0x0002) & 0xffff).toBe(0x0000);
  expect(alu.calc(opcode.MOD, 0x0009, 0x0002) & 0xffff).toBe(0x0001);
  expect(alu.calc(opcode.MOD, 0x00ff, 0xffff) & 0xffff).toBe(0x00ff);

  expect(alu.calc(opcode.MOD, 0x0001, 0x0000) & 0xffff).toBe(0x0000);
  expect(intrController.checkIntrNum()).toBe(intr.EXCP_ZERO_DIV); /* 0除算例外の確認 */

  expect(alu.calc(opcode.SHLA, 0x0055, 0x0001) & 0xffff).toBe(0x00aa);
  expect(alu.calc(opcode.SHLA, 0xff00, 0x0004) & 0xffff).toBe(0xf000);

  expect(alu.calc(opcode.SHLL, 0x0055, 0x0001) & 0xffff).toBe(0x00aa);
  expect(alu.calc(opcode.SHLL, 0xff00, 0x0004) & 0xffff).toBe(0xf000);

  expect(alu.calc(opcode.SHRA, 0x00aa, 0x0001) & 0xffff).toBe(0x0055);
  expect(alu.calc(opcode.SHRA, 0x8000, 0x0008) & 0xffff).toBe(0xff80);

  expect(alu.calc(opcode.SHRL, 0x00aa, 0x0001) & 0xffff).toBe(0x0055);
  expect(alu.calc(opcode.SHRL, 0x8000, 0x0008) & 0xffff).toBe(0x0080);
});
