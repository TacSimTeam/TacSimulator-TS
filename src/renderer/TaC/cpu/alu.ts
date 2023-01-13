import { IIntrSignal } from '../interface';
import { EXCP_ZERO_DIV } from '../interrupt/interruptKind';
import * as opcode from './const/opcode';

export class Alu {
  private intrSig: IIntrSignal;

  constructor(intrSig: IIntrSignal) {
    this.intrSig = intrSig;
  }

  /**
   * opの値に応じてleftとrightに何らかの演算をして結果を返す
   * opがopcode.SUBの場合は(left - right)
   *
   * @param op 演算の種類を表すオペコード
   * @param left 16bit整数
   * @param right 16bit整数
   * @return 演算結果(16bitに正規化せずに返すことに注意)
   */
  calc(op: number, left: number, right: number): number {
    switch (op) {
      case opcode.ADD:
        return left + right;
      case opcode.SUB:
        return left - right;
      case opcode.CMP:
        return left - right;
      case opcode.AND:
        return left & right;
      case opcode.OR:
        return left | right;
      case opcode.XOR:
        return left ^ right;
      case opcode.ADDS:
        return left + right * 2;
      case opcode.MUL:
        return left * right;
      case opcode.DIV:
        return this.div(left, right);
      case opcode.MOD:
        return this.mod(left, right);
      case opcode.SHLA:
        return this.shift_left(left, right);
      case opcode.SHLL:
        return this.shift_left(left, right);
      case opcode.SHRA:
        return this.shift_right_arithmetic(left, right);
      case opcode.SHRL:
        return this.shift_right_logical(left, right);
    }
    return 0;
  }

  private div(dividend: number, divisor: number): number {
    if (divisor === 0) {
      this.intrSig.interrupt(EXCP_ZERO_DIV);
      return 0;
    }
    return Math.trunc(dividend / divisor);
  }

  private mod(dividend: number, divisor: number): number {
    if (divisor === 0) {
      this.intrSig.interrupt(EXCP_ZERO_DIV);
      return 0;
    }

    return dividend % divisor;
  }

  private shift_left(operand: number, bit: number): number {
    // シフト命令ではrightの符号に関わらず下位4bitをシフトするbit数として使用する
    // そのためにrightと0x0fのANDをとっている
    return operand << (bit & 0x0f);
  }

  private shift_right_arithmetic(operand: number, bit: number): number {
    if ((operand & 0x8000) !== 0) {
      return (operand | ~0xffff) >> (bit & 0x0f);
    }
    return operand >> (bit & 0x0f);
  }

  private shift_right_logical(operand: number, bit: number): number {
    return operand >>> (bit & 0x0f);
  }
}
