import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';
import * as operation from '../src/renderer/TaC/cpu/operation';
import { REGISTER_FLAG, REGISTER_G0, REGISTER_G1 } from '../src/renderer/TaC/cpu/register';

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // 実効アドレス
  operand: number; // オペランド
};

test('Operation LD test', () => {
  const cpu = new Cpu(new Mmu(new Memory()));
  const inst: Instruction = {
    op: operation.LD,
    addrMode: 0,
    rd: REGISTER_G0,
    rx: 0,
    dsp: 0,
    operand: 0x1234,
  };

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

  const inst: Instruction = {
    op: operation.ST,
    addrMode: 0,
    rd: REGISTER_G0,
    rx: 0,
    dsp: 0x1000,
    operand: 0,
  };
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
