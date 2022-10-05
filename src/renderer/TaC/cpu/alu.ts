import { IAlu, IIntrSignal } from '../interface';
import * as opcode from './instruction/opcode';
import { EXCP_ZERO_DIV } from '../interrupt/interruptNum';

export class Alu implements IAlu {
  private intrSignal: IIntrSignal;

  constructor(intrSignal: IIntrSignal) {
    this.intrSignal = intrSignal;
  }

  calc(op: number, v1: number, v2: number): number {
    switch (op) {
      case opcode.ADD:
        return v1 + v2;
      case opcode.SUB:
      case opcode.CMP:
        return v1 + (~v2 + 1);
      case opcode.AND:
        return v1 & v2;
      case opcode.OR:
        return v1 | v2;
      case opcode.XOR:
        return v1 ^ v2;
      case opcode.ADDS:
        return v1 + v2 * 2;
      case opcode.MUL:
        return v1 * v2;
      case opcode.DIV:
        if (v2 === 0) {
          this.intrSignal.interrupt(EXCP_ZERO_DIV);
          return 0;
        }
        return Math.trunc(v1 / v2);
      case opcode.MOD:
        if (v2 === 0) {
          this.intrSignal.interrupt(EXCP_ZERO_DIV);
          return 0;
        }
        return v1 % v2;
      case opcode.SHLA:
      case opcode.SHLL:
        return v1 << v2;
      case opcode.SHRA:
        if ((v1 & 0x8000) != 0) {
          return (v1 | ~0xffff) >> v2;
        }
        return v1 >>> v2;
      case opcode.SHRL:
        return v1 >>> v2;
    }
    return 0;
  }
}
