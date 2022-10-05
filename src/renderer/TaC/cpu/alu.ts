import { IAlu } from '../interface';
import * as opcode from './instruction/opcode';

export class Alu implements IAlu {
  calc(op: number, v1: number, v2: number): number {
    return 0;
  }
}
