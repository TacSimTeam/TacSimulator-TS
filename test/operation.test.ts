import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';
import { Instruction } from '../src/renderer/TaC/cpu/instruction/instruction';
import * as operation from '../src/renderer/TaC/cpu/instruction/opcode';
import { REGISTER_FLAG, REGISTER_G0, REGISTER_G1, REGISTER_SP } from '../src/renderer/TaC/cpu/register';
import { IntrController } from '../src/renderer/TaC/interrupt/intrController';

const FLAG_E = 0x80;
const FLAG_P = 0x40;
const FLAG_I = 0x20;
const FLAG_V = 0x08;
const FLAG_C = 0x04;
const FLAG_S = 0x02;
const FLAG_Z = 0x01;

function createInstruction(
  op: number,
  addrMode: number,
  rd: number,
  rx: number,
  dsp: number,
  operand: number
): Instruction {
  return {
    opcode: op,
    addrMode: addrMode,
    rd: rd,
    rx: rx,
    dsp: dsp,
    operand: operand,
  };
}

test('Change flag test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  cpu['changeFlag'](operation.ADD, 0x10001, 0, 0);
  expect(cpu['evalFlag'](FLAG_C)).toBe(true);

  cpu['changeFlag'](operation.ADD, 0x8000, 0, 0);
  expect(cpu['evalFlag'](FLAG_S)).toBe(true);

  cpu['changeFlag'](operation.ADD, 0x0000, 0, 0);
  expect(cpu['evalFlag'](FLAG_Z)).toBe(true);

  cpu['changeFlag'](operation.ADD, 0x18000, 0, 0);
  expect(cpu['evalFlag'](FLAG_C)).toBe(true);
  expect(cpu['evalFlag'](FLAG_S)).toBe(true);

  cpu['changeFlag'](operation.ADD, 0x10000, 0, 0);
  expect(cpu['evalFlag'](FLAG_C)).toBe(true);
  expect(cpu['evalFlag'](FLAG_Z)).toBe(true);

  /* シフト命令のときのCフラグ変化テスト */
  /* 1ビットシフト以外はCフラグが変化しない */
  cpu['changeFlag'](operation.SHLA, 0x10000, 0, 1);
  expect(cpu['evalFlag'](FLAG_C)).toBe(true);
  cpu['changeFlag'](operation.SHRL, 0x10000, 0, 2);
  expect(cpu['evalFlag'](FLAG_C)).toBe(false);

  /* ADD命令のオーバーフローテスト */
  /* 0x7fff(正) + 0x0001(正) = 0x8000(負) */
  cpu['changeFlag'](operation.ADD, 0x8000, 0x7fff, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(true);

  /* 0x7000(正) + 0x0001(正) = 0x7001(正) */
  cpu['changeFlag'](operation.ADD, 0x7001, 0x7000, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x8000(負) + 0x0001(正) = 0x8001(負) */
  cpu['changeFlag'](operation.ADD, 0x8001, 0x8000, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x8000(負) + 0x8001(負) = 0x0001(正) */
  cpu['changeFlag'](operation.ADD, 0x0001, 0x8000, 0x8001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(true);

  /* 0xffff(負) + 0xffff(負) = 0xfffe(負) */
  cpu['changeFlag'](operation.ADD, 0xfffe, 0xffff, 0xffff);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* SUB命令のオーバーフローテスト */
  /* 0x7fff(正) - 0x0001(正) = 0x7ffe(正) */
  cpu['changeFlag'](operation.SUB, 0x7ffe, 0x7fff, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x0001(正) - 0x7fff(正) = 0x8000(負) */
  cpu['changeFlag'](operation.SUB, 0x8000, 0x0001, 0x7fff);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x8000(負) - 0x0001(正) = 0x7fff(正) */
  cpu['changeFlag'](operation.SUB, 0x7fff, 0x8000, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(true);

  /* 0xffff(負) - 0x0001(正) = 0xfffe(負) */
  cpu['changeFlag'](operation.SUB, 0xfffe, 0xffff, 0x0001);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x0001(正) - 0xffff(負) = 0x0002(正) */
  cpu['changeFlag'](operation.SUB, 0x0002, 0x0001, 0xffff);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0x7fff(正) - 0xffff(負) = 0x8000(負) */
  cpu['changeFlag'](operation.SUB, 0x8000, 0x7fff, 0xffff);
  expect(cpu['evalFlag'](FLAG_V)).toBe(true);

  /* 0xffff(負) - 0xfffe(負) = 0x0001(正) */
  cpu['changeFlag'](operation.SUB, 0x0001, 0xffff, 0xfffe);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);

  /* 0xfffe(負) - 0xffff(負) = 0xffff(負) */
  cpu['changeFlag'](operation.SUB, 0xffff, 0xfffe, 0xffff);
  expect(cpu['evalFlag'](FLAG_V)).toBe(false);
});

test('Operation LD test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  const inst = createInstruction(operation.LD, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1234);

  /* フラグへのロード */
  inst.rd = REGISTER_FLAG;
  inst.operand = 0x1234;
  cpu['execInstruction'](inst);
  expect(cpu['cpuFlag']).toBe(0x34);
});

test('Operation ST test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  const inst = createInstruction(operation.ST, 0, REGISTER_G0, 0, 0x1000, 0);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);
  expect(mmu.read16(0x1000)).toBe(0x1234);

  /* Byte register indirectモードでの動作テスト */
  inst.addrMode = 7;
  inst.rd = REGISTER_G1;

  inst.dsp = 0x1000;
  cpu['setRegister'](REGISTER_G1, 0x3456);
  cpu['execInstruction'](inst);
  expect(mmu.read8(0x1000)).toBe(0x0056);

  inst.dsp = 0x1001;
  cpu['setRegister'](REGISTER_G1, 0x5678);
  cpu['execInstruction'](inst);
  expect(mmu.read8(0x1001)).toBe(0x0078);
});

test('Operation ADD test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* ADD G0(0x4321), #0x1234 */
  const inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x4321);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x5555);
});

test('Operation SUB test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* SUB G0(0x5555), #0x1234 */
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x5555);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x4321);

  /* SUB G0(0x0001), #0x0002 */
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xffff);

  /* SUB G0(0xaaaa), #0xaaaa */
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0xaaaa);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0000);
});

test('Operation CMP test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* CMP G0(0x0001), #0x0002 */
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['execInstruction'](inst);
  expect(cpu['getFlag']() & FLAG_Z).toBe(0); /* Zフラグが0 */

  /* CMP G0(0xaaaa), #0xaaaa */
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0xaaaa);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['execInstruction'](inst);
  expect(cpu['getFlag']() & FLAG_Z).not.toBe(0); /* Zフラグが1 */
});

test('Operation AND test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* AND G0(0x1234), #0xffff */
  const inst = createInstruction(operation.AND, 0, REGISTER_G0, 0, 0, 0x0f0f);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0204);
});

test('Operation OR test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* OR G0(0x1010), #0x0101 */
  const inst = createInstruction(operation.OR, 0, REGISTER_G0, 0, 0, 0x0101);
  cpu['setRegister'](REGISTER_G0, 0x1010);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1111);
});

test('Operation XOR test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* XOR G0(0xaaaa), #0xffff */
  const inst = createInstruction(operation.XOR, 0, REGISTER_G0, 0, 0, 0xffff);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x5555);
});

test('Operation ADDS test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* ADDS G0(0x1000), #0x0004 */
  const inst = createInstruction(operation.ADDS, 0, REGISTER_G0, 0, 0, 0x0004);
  cpu['setRegister'](REGISTER_G0, 0x1000);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1008);
});

test('Operation MUL test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* MUL G0(0x1234), #0x0056 */
  const inst = createInstruction(operation.MUL, 0, REGISTER_G0, 0, 0, 0x0056);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1d78);
});

test('Operation DIV test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* DIV G0(0x1234), #0x0011 */
  inst = createInstruction(operation.DIV, 0, REGISTER_G0, 0, 0, 0x0011);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0112);

  /* DIV G0(0x5678), #0x0020 */
  inst = createInstruction(operation.DIV, 0, REGISTER_G0, 0, 0, 0x0020);
  cpu['setRegister'](REGISTER_G0, 0x5678);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x02b3);
});

test('Operation MOD test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* MOD G0(0x1234), #0x0011 */
  inst = createInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0011);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0002);

  /* MOD G0(0x5678), #0x0020 */
  inst = createInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0020);
  cpu['setRegister'](REGISTER_G0, 0x5678);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0018);

  /* MOD G0(0x0039), #0x0003 */
  inst = createInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0003);
  cpu['setRegister'](REGISTER_G0, 0x0039);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0000);
});

test('Operation SHLA, SHLL test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* SHLA G0(0x0555), #0x0005 */
  inst = createInstruction(operation.SHLA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0555);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xaaa0);

  /* SHLL G0(0x0555), #0x0005 */
  inst = createInstruction(operation.SHLL, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0555);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xaaa0);
});

test('Operation SHRA test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* SHRA G0(0x0aaa), #0x0005 (MSB = 0) */
  inst = createInstruction(operation.SHRA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0aaa);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0055);

  /* SHRA G0(0xaaa0), #0x0005 (MSB = 1) */
  inst = createInstruction(operation.SHRA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0xaaa0);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xfd55);
});

test('Operation SHRL test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  /* SHRL G0(0xaaa0), #0x0005 */
  const inst = createInstruction(operation.SHRL, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0xaaa0);
  cpu['execInstruction'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0555);
});

test('Operation JZ test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* CMP G0(0x0001), #0x0001 */
  /* JZ 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JZ, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* CMP G0(0x0011), #0x0001 */
  /* JZ 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x0011);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JZ, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JC test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0001 */
  /* JC 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JC, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xfffe), #0x0001 */
  /* JC 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xfffe);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JC, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JM test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* SUB G0(0x1234), #0x4321 */
  /* JM 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x4321);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JM, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* SUB G0(0x1234), #0x1234 */
  /* JM 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JM, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JO test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0x8000), #0x8000 */
  /* JO 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x8000);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JO, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0x8000), #0x0fff */
  /* JO 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0fff);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JO, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JGT test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0002 (2 + (-1)) */
  /* JGT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xffff), #0x0001 (1 + (-1)) */
  /* JGT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xffff), #0x0000 (0 + (-1)) */
  /* JGT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JGE test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0002 (2 + (-1)) */
  /* JGE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xffff), #0x0001 (1 + (-1)) */
  /* JGE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xffff), #0x0000 (0 + (-1)) */
  /* JGE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JGE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JLE test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0002 (2 + (-1)) */
  /* JLE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xffff), #0x0001 (1 + (-1)) */
  /* JLE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xffff), #0x0000 (0 + (-1)) */
  /* JLE 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLE, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JLT test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0002 (2 + (-1)) */
  /* JLT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xffff), #0x0001 (1 + (-1)) */
  /* JLT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xffff), #0x0000 (0 + (-1)) */
  /* JLT 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLT, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JNZ test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* CMP G0(0x0001), #0x0001 */
  /* JNZ 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNZ, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* CMP G0(0x0011), #0x0001 */
  /* JNZ 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x0011);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNZ, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JNC test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0xffff), #0x0001 */
  /* JNC 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNC, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xfffe), #0x0001 */
  /* JNC 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xfffe);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNC, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JNM test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* SUB G0(0x1234), #0x4321 */
  /* JNM 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x4321);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNM, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* SUB G0(0x1234), #0x1234 */
  /* JNM 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNM, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JNO test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0x8000), #0x8000 */
  /* JO 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x8000);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNO, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0x8000), #0x0fff */
  /* JO 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0fff);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JNO, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JHI test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0x8000), #0x0001 (1 + 32768) */
  /* JHI 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JHI, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0xffff), #0x0001 (1 + 65535) */
  /* JHI 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JHI, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0x0000), #0x0000 (0 + 0) */
  /* JHI 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0x0000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JHI, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);
});

test('Operation JLS test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);
  let inst: Instruction;

  /* ADD G0(0x8000), #0x0001 (1 + 32768) */
  /* JLS 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0x8000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLS, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x0000);

  /* ADD G0(0xffff), #0x0001 (1 + 65535) */
  /* JLS 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0001);
  cpu['setRegister'](REGISTER_G0, 0xffff);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLS, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);

  /* ADD G0(0x0000), #0x0000 (0 + 0) */
  /* JLS 0x1000 */
  cpu.setPC(0x0000);
  inst = createInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x0000);
  cpu['setRegister'](REGISTER_G0, 0x0000);
  cpu['execInstruction'](inst);

  inst = createInstruction(operation.JMP, 0, operation.JMP_JLS, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation JMP test', () => {
  const intrController = new IntrController();
  const cpu = new Cpu(new Mmu(new Memory(), intrController), intrController);

  cpu.setPC(0x0000);
  const inst = createInstruction(operation.JMP, 0, operation.JMP_JMP, 0, 0x1000, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x1000);
});

test('Operation CALL test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  /* SPの初期値は0xfffeとする */
  cpu.setRegister(REGISTER_SP, 0xfffe);

  /* CALL 0x5678 */
  cpu.setPC(0x1234);
  const inst = createInstruction(operation.CALL, 0, 0, 0, 0x5678, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x5678);
  expect(mmu.read16(cpu.getRegister(REGISTER_SP))).toBe(0x1234);
});

test('Operation PUSH, POP test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);
  let inst: Instruction;

  /* SPの初期値は0xfffeとする */
  cpu.setRegister(REGISTER_SP, 0xfffe);

  /* PUSH G0(0x5555) */
  cpu['setRegister'](REGISTER_G0, 0x5555);
  inst = createInstruction(operation.PUSH_POP, 0, REGISTER_G0, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getRegister(REGISTER_SP)).toBe(0xfffe - 2);
  expect(mmu.read16(cpu.getRegister(REGISTER_SP))).toBe(0x5555);

  /* PUSH G1(0x7777) */
  cpu['setRegister'](REGISTER_G1, 0x7777);
  inst = createInstruction(operation.PUSH_POP, 0, REGISTER_G1, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getRegister(REGISTER_SP)).toBe(0xfffe - 4);
  expect(mmu.read16(cpu.getRegister(REGISTER_SP))).toBe(0x7777);

  /* POP G0 */
  inst = createInstruction(operation.PUSH_POP, 4, REGISTER_G0, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getRegister(REGISTER_SP)).toBe(0xfffe - 2);
  expect(cpu.getRegister(REGISTER_G0)).toBe(0x7777);

  /* POP G1 */
  inst = createInstruction(operation.PUSH_POP, 4, REGISTER_G1, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getRegister(REGISTER_SP)).toBe(0xfffe);
  expect(cpu.getRegister(REGISTER_G1)).toBe(0x5555);
});

test('Operation RET test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);

  /* SPの初期値は0xfffeとする */
  cpu.setRegister(REGISTER_SP, 0xfffe);

  /* スタックに予め0x5678をPUSHする */
  cpu['pushVal'](0x5678);

  /* RET */
  cpu.setPC(0x1234);
  const inst = createInstruction(operation.RET_RETI, 0, 0, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getPC()).toBe(0x5678);
});

test('Operation RETI test', () => {
  const intrController = new IntrController();
  const mmu = new Mmu(new Memory(), intrController);
  const cpu = new Cpu(mmu, intrController);
  let inst: Instruction;

  /* SPの初期値は0xfffeとする */
  cpu.setRegister(REGISTER_SP, 0xfffe);

  /* I/O特権モード or ユーザモードのときのテスト */

  /* CPUをI/O特権モードにする */
  cpu['cpuFlag'] = FLAG_I;

  /* スタックに予め0x007f, 0x5678をPUSHする */
  cpu['pushVal'](0x5678);
  cpu['pushVal'](FLAG_E | FLAG_P | FLAG_V | FLAG_C | FLAG_S | FLAG_Z);

  /* RETI */
  cpu.setPC(0x1234);
  inst = createInstruction(operation.RET_RETI, 4, 0, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getFlag()).toBe(FLAG_I | FLAG_V | FLAG_C | FLAG_S | FLAG_Z);
  expect(cpu.getPC()).toBe(0x5678);
  expect(cpu['register']['privMode']).toBe(false);

  /* 特権モードのときのテスト */

  /* CPUを特権モードにする */
  cpu['cpuFlag'] = FLAG_P;

  /* スタックに予め0x007f, 0x5678をPUSHする */
  cpu['pushVal'](0x5678);
  cpu['pushVal'](FLAG_E | FLAG_P | FLAG_V | FLAG_C | FLAG_S | FLAG_Z);

  /* RETI */
  cpu.setPC(0x1234);
  inst = createInstruction(operation.RET_RETI, 4, 0, 0, 0, 0);
  cpu['execInstruction'](inst);
  expect(cpu.getFlag()).toBe(FLAG_E | FLAG_P | FLAG_V | FLAG_C | FLAG_S | FLAG_Z);
  expect(cpu.getPC()).toBe(0x5678);
  expect(cpu['register']['privMode']).toBe(true);
});
