import { Instruction } from '../cpu/instruction/instruction';
import * as inst from '../cpu/const/opcode';
import * as regNum from '../cpu/const/regNum';

export function printInstruction(inst: Instruction, pc: number) {
  const op = opcodeToString(inst.opcode, inst.addrMode, inst.rd);
  const rd = regNumToString(inst.rd);
  const rx = regNumToString(inst.rx);
  console.log(`0x${pc.toString(16)} : ${op} ${rd}, ${rx} (Addrmode : ${inst.addrMode})`);
}

export function opcodeToString(opcode: number, addrMode: number, rd: number) {
  switch (opcode) {
    case inst.NOP:
      return 'NOP';
    case inst.LD:
      return 'LD';
    case inst.ST:
      return 'ST';
    case inst.ADD:
      return 'ADD';
    case inst.SUB:
      return 'SUB';
    case inst.CMP:
      return 'CMP';
    case inst.AND:
      return 'AND';
    case inst.OR:
      return 'OR';
    case inst.XOR:
      return 'XOR';
    case inst.ADDS:
      return 'ADDS';
    case inst.MUL:
      return 'MUL';
    case inst.DIV:
      return 'DIV';
    case inst.MOD:
      return 'MOD';
    case inst.SHLA:
      return 'SHLA';
    case inst.SHLL:
      return 'SHLL';
    case inst.SHRA:
      return 'SHRA';
    case inst.SHRL:
      return 'SHRL';
    case inst.JMP:
      switch (rd) {
        case inst.JMP_JZ:
          return 'JZ';
        case inst.JMP_JC:
          return 'JC';
        case inst.JMP_JM:
          return 'JM';
        case inst.JMP_JO:
          return 'JO';
        case inst.JMP_JGT:
          return 'JGT';
        case inst.JMP_JGE:
          return 'JGE';
        case inst.JMP_JLE:
          return 'JLE';
        case inst.JMP_JLT:
          return 'JLT';
        case inst.JMP_JNZ:
          return 'JNZ';
        case inst.JMP_JNC:
          return 'JNC';
        case inst.JMP_JNM:
          return 'JNM';
        case inst.JMP_JNO:
          return 'JNO';
        case inst.JMP_JHI:
          return 'JHI';
        case inst.JMP_JLS:
          return 'JLS';
        default:
          break;
      }
      return 'JMP';
    case inst.CALL:
      return 'CALL';
    case inst.IN:
      return 'IN';
    case inst.OUT:
      return 'OUT';
    case inst.PUSH_POP:
      return addrMode == 0 ? 'PUSH' : 'POP';
    case inst.RET_RETI:
      return addrMode == 0 ? 'RET' : 'RETI';
    case inst.SVC:
      return 'SVC';
    case inst.HALT:
      return 'HALT';
    default:
      return '?????(0x' + opcode.toString(16) + ')';
  }
}

export function regNumToString(num: number) {
  switch (num) {
    case regNum.G0:
      return 'G0';
    case regNum.G1:
      return 'G1';
    case regNum.G2:
      return 'G2';
    case regNum.G3:
      return 'G3';
    case regNum.G4:
      return 'G4';
    case regNum.G5:
      return 'G5';
    case regNum.G6:
      return 'G6';
    case regNum.G7:
      return 'G7';
    case regNum.G8:
      return 'G8';
    case regNum.G9:
      return 'G9';
    case regNum.G10:
      return 'G10';
    case regNum.G11:
      return 'G11';
    case regNum.FP:
      return 'FP';
    case regNum.SP:
      return 'SSP';
    case regNum.USP:
      return 'USP';
    case regNum.FLAG:
      return 'FLAG';
    default:
      return '???(' + num.toString() + ')';
  }
}
