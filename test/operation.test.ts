import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';
import * as operation from '../src/renderer/TaC/cpu/operation';
import { REGISTER_FLAG, REGISTER_G0, REGISTER_G1 } from '../src/renderer/TaC/cpu/register';

const FLAG_E = 0x80;
const FLAG_P = 0x40;
const FLAG_I = 0x20;
const FLAG_V = 0x08;
const FLAG_C = 0x04;
const FLAG_S = 0x02;
const FLAG_Z = 0x01;

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // 実効アドレス
  operand: number; // オペランド
};

function makeInstruction(
  op: number,
  addrMode: number,
  rd: number,
  rx: number,
  dsp: number,
  operand: number
): Instruction {
  return {
    op: op,
    addrMode: addrMode,
    rd: rd,
    rx: rx,
    dsp: dsp,
    operand: operand,
  };
}

test('Change flag test (without overflow flag)', () => {
  // オーバーフローフラグのテストはADD, SUB, CMPのテストで記述している
  const mmu = new Mmu(new Memory());
  const cpu = new Cpu(mmu);

  cpu['changeFlag'](operation.NOP, 0x10001, 0, 0);
  expect(cpu['getFlag']() & FLAG_C).not.toBe(0); // Cフラグが1

  cpu['changeFlag'](operation.NOP, 0x8000, 0, 0);
  expect(cpu['getFlag']() & FLAG_S).not.toBe(0); // Sフラグが1

  cpu['changeFlag'](operation.NOP, 0x0000, 0, 0);
  expect(cpu['getFlag']() & FLAG_Z).not.toBe(0); // Zフラグが1

  cpu['changeFlag'](operation.NOP, 0x18000, 0, 0);
  expect(cpu['getFlag']() & FLAG_C).not.toBe(0);
  expect(cpu['getFlag']() & FLAG_S).not.toBe(0);

  cpu['changeFlag'](operation.NOP, 0x10000, 0, 0);
  expect(cpu['getFlag']() & FLAG_C).not.toBe(0);
  expect(cpu['getFlag']() & FLAG_Z).not.toBe(0);
});

test('Operation LD test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  const inst = makeInstruction(operation.LD, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['instrLD'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1234);

  // フラグへのロード
  inst.rd = REGISTER_FLAG;
  inst.operand = 0x1234;
  cpu['instrLD'](inst);
  expect(cpu['flag']).toBe(0x34);
});

test('Operation ST test', () => {
  const mmu = new Mmu(new Memory());
  const cpu = new Cpu(mmu);

  const inst = makeInstruction(operation.ST, 0, REGISTER_G0, 0, 0x1000, 0);
  cpu['setRegister'](REGISTER_G0, 0x1234);

  cpu['instrST'](inst);
  expect(mmu.read16(0x1000)).toBe(0x1234);

  // Byte register indirectモードでの動作テスト
  inst.addrMode = 7; // Byte register indirect
  inst.rd = REGISTER_G1;

  inst.dsp = 0x1000;
  cpu['setRegister'](REGISTER_G1, 0x3456);
  cpu['instrST'](inst);
  expect(mmu.read8(0x1000)).toBe(0x0056);

  inst.dsp = 0x1001;
  cpu['setRegister'](REGISTER_G1, 0x5678);
  cpu['instrST'](inst);
  expect(mmu.read8(0x1001)).toBe(0x0078);
});

test('Operation ADD test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  // let inst: Instruction;

  // ADD G0(0x4321), #0x1234
  const inst = makeInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x4321);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x5555);

  // オーバーフローテスト
  // ADD G0(0x8000), #0xffff
  // inst = makeInstruction(operation.ADD, 0, REGISTER_G0, 0, 0, 0xffff);
  // cpu['setRegister'](REGISTER_G0, 0x8000);
  // cpu['instrCalculation'](inst);
  // expect(cpu['getRegister'](REGISTER_G0)).toBe(0x5555);
});

test('Operation SUB test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // SUB G0(0x5555), #0x1234
  inst = makeInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x1234);
  cpu['setRegister'](REGISTER_G0, 0x5555);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x4321);

  // SUB G0(0x0001), #0x0002
  inst = makeInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xffff);

  // SUB G0(0xaaaa), #0xaaaa
  inst = makeInstruction(operation.SUB, 0, REGISTER_G0, 0, 0, 0xaaaa);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0000);

  // オーバーフローテスト
});

test('Operation CMP test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // CMP G0(0x0001), #0x0002
  inst = makeInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0x0002);
  cpu['setRegister'](REGISTER_G0, 0x0001);
  cpu['instrCalculation'](inst);
  expect(cpu['getFlag']() & FLAG_Z).toBe(0); // Zフラグが0

  // CMP G0(0xaaaa), #0xaaaa
  inst = makeInstruction(operation.CMP, 0, REGISTER_G0, 0, 0, 0xaaaa);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['instrCalculation'](inst);
  expect(cpu['getFlag']() & FLAG_Z).not.toBe(0); // Zフラグが1

  // オーバーフローテスト
});

test('Operation AND test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // AND G0(0x1234), #0xffff
  const inst = makeInstruction(operation.AND, 0, REGISTER_G0, 0, 0, 0x0f0f);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0204);
});

test('Operation OR test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // OR G0(0x1010), #0x0101
  const inst = makeInstruction(operation.OR, 0, REGISTER_G0, 0, 0, 0x0101);
  cpu['setRegister'](REGISTER_G0, 0x1010);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1111);
});

test('Operation XOR test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // XOR G0(0xaaaa), #0xffff
  const inst = makeInstruction(operation.XOR, 0, REGISTER_G0, 0, 0, 0xffff);
  cpu['setRegister'](REGISTER_G0, 0xaaaa);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x5555);
});

test('Operation ADDS test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // ADDS G0(0x1000), #0x0004
  const inst = makeInstruction(operation.ADDS, 0, REGISTER_G0, 0, 0, 0x0004);
  cpu['setRegister'](REGISTER_G0, 0x1000);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1008);
});

test('Operation MUL test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // MUL G0(0x1234), #0x0056
  const inst = makeInstruction(operation.MUL, 0, REGISTER_G0, 0, 0, 0x0056);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x1d78);
});

test('Operation DIV test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // DIV G0(0x1234), #0x0011
  inst = makeInstruction(operation.DIV, 0, REGISTER_G0, 0, 0, 0x0011);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0112);

  // DIV G0(0x5678), #0x0020
  inst = makeInstruction(operation.DIV, 0, REGISTER_G0, 0, 0, 0x0020);
  cpu['setRegister'](REGISTER_G0, 0x5678);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x02b3);

  // ゼロ除算テスト
  // 割り込みの処理を書くまで動かさない
  // DIV G0(0xffff), #0x0000
  // inst = makeInstruction(operation.DIV, 0, REGISTER_G0, 0, 0, 0x0000);
  // cpu['setRegister'](REGISTER_G0, 0xffff);
  // cpu['instrCalculation'](inst);
});

test('Operation MOD test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // MOD G0(0x1234), #0x0011
  inst = makeInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0011);
  cpu['setRegister'](REGISTER_G0, 0x1234);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0002);

  // MOD G0(0x5678), #0x0020
  inst = makeInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0020);
  cpu['setRegister'](REGISTER_G0, 0x5678);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0018);

  // MOD G0(0x0039), #0x0003
  inst = makeInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0003);
  cpu['setRegister'](REGISTER_G0, 0x0039);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0000);

  // ゼロ除算テスト
  // 割り込みの処理を書くまで動かさない
  // MOD G0(0xffff), #0x0000
  // inst = makeInstruction(operation.MOD, 0, REGISTER_G0, 0, 0, 0x0000);
  // cpu['setRegister'](REGISTER_G0, 0xffff);
  // cpu['instrCalculation'](inst);
});

test('Operation SHLA, SHLL test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // SHLA G0(0x0555), #0x0005
  inst = makeInstruction(operation.SHLA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0555);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xaaa0);

  // SHLL G0(0x0555), #0x0005
  inst = makeInstruction(operation.SHLL, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0555);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xaaa0);
});

test('Operation SHRA test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  let inst: Instruction;

  // SHRA G0(0x0aaa), #0x0005 (MSB = 0)
  inst = makeInstruction(operation.SHRA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0x0aaa);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0055);

  // SHRA G0(0xaaa0), #0x0005 (MSB = 1)
  inst = makeInstruction(operation.SHRA, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0xaaa0);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0xfd55);
});

test('Operation SHRL test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));

  // SHRL G0(0xaaa0), #0x0005
  const inst = makeInstruction(operation.SHRL, 0, REGISTER_G0, 0, 0, 0x0005);
  cpu['setRegister'](REGISTER_G0, 0xaaa0);
  cpu['instrCalculation'](inst);
  expect(cpu['getRegister'](REGISTER_G0)).toBe(0x0555);
});
