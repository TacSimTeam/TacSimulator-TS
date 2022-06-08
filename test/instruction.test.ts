import { Cpu } from '../src/renderer/TaC/cpu/cpu';
import { Mmu } from '../src/renderer/TaC/memory/mmu';
import { Memory } from '../src/renderer/TaC/memory/memory';
import * as operation from '../src/renderer/TaC/cpu/operation';
import { REGISTER_G0, REGISTER_G1 } from '../src/renderer/TaC/cpu/register';

type Instruction = {
  op: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  dsp: number; // 実効アドレス
  operand: number; // オペランド
};

test('LD test', () => {
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
});

test('ST test', () => {
  const mmu = new Mmu(new Memory());
  const cpu = new Cpu(mmu);

  const inst: Instruction = {
    op: operation.ST,
    addrMode: 0,
    rd: REGISTER_G1,
    rx: 0,
    dsp: 0x1000,
    operand: 0,
  };
  cpu['setRegister'](REGISTER_G1, 0x1234);

  cpu['instrST'](inst);
  expect(mmu.read16(0x1000)).toBe(0x1234);
});
