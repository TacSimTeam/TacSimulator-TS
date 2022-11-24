import { IIntrSignal } from '../interface';
import * as opcode from './instruction/opcode';
import { EXCP_ZERO_DIV } from '../interrupt/interruptNum';

/**
 * opの値に応じてv1とv2に何らかの演算をして結果を返す
 * opがopcode.ADDの場合は(v1 + v2)
 *
 * @param op 演算の種類を表すオペコード
 * @param v1 16bit整数
 * @param v2 16bit整数
 * @return 演算結果(16bitに正規化せずに返すことに注意)
 */
export class Alu {
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
