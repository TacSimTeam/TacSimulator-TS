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
        return v1 - v2;
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
        /**
         * シフト命令ではv2の符号に関わらず下位4bitをシフトするbit数として使用する
         * そのためにv2と0x0fのANDをとっている
         */
        return v1 << (v2 & 0x0f);
      case opcode.SHRA:
        if ((v1 & 0x8000) != 0) {
          return (v1 | ~0xffff) >> (v2 & 0x0f);
        }
        return v1 >> (v2 & 0x0f);
      case opcode.SHRL:
        return v1 >>> (v2 & 0x0f);
    }
    return 0;
  }
}
