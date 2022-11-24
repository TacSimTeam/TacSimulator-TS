import { IIntrSignal } from '../interface';
import * as opcode from './const/opcode';
import { EXCP_ZERO_DIV } from '../interrupt/interruptNum';

export class Alu {
  private intrSignal: IIntrSignal;

  constructor(intrSignal: IIntrSignal) {
    this.intrSignal = intrSignal;
  }

  /**
   * opの値に応じてv1とv2に何らかの演算をして結果を返す
   * opがopcode.ADDの場合は(v1 + v2)
   *
   * @param op 演算の種類を表すオペコード
   * @param v1 16bit整数
   * @param v2 16bit整数
   * @return 演算結果(16bitに正規化せずに返すことに注意)
   */
  calc(op: number, v1: number, v2: number): number {
    switch (op) {
      case opcode.ADD:
        return v1 + v2;
      case opcode.SUB:
        return v1 - v2;
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
        return this.div(v1, v2);
      case opcode.MOD:
        return this.mod(v1, v2);
      case opcode.SHLA:
        return this.shift_left(v1, v2);
      case opcode.SHLL:
        return this.shift_left(v1, v2);
      case opcode.SHRA:
        return this.shift_right_arithmetic(v1, v2);
      case opcode.SHRL:
        return this.shift_right_logical(v1, v2);
    }
    return 0;
  }

  private div(dividend: number, divisor: number) {
    if (divisor === 0) {
      this.intrSignal.interrupt(EXCP_ZERO_DIV);
      return 0;
    }
    return Math.trunc(dividend / divisor);
  }

  private mod(dividend: number, divisor: number) {
    if (divisor === 0) {
      this.intrSignal.interrupt(EXCP_ZERO_DIV);
      return 0;
    }
    return dividend % divisor;
  }

  private shift_left(operand: number, bit: number) {
    /**
     * シフト命令ではv2の符号に関わらず下位4bitをシフトするbit数として使用する
     * そのためにv2と0x0fのANDをとっている
     */
    return operand << (bit & 0x0f);
  }

  private shift_right_arithmetic(operand: number, bit: number) {
    if ((operand & 0x8000) != 0) {
      return (operand | ~0xffff) >> (bit & 0x0f);
    }
    return operand >> (bit & 0x0f);
  }

  private shift_right_logical(operand: number, bit: number) {
    return operand >>> (bit & 0x0f);
  }
}
