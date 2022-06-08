export const NOP = 0x00;
export const LD = 0x01;
export const ST = 0x02;
export const ADD = 0x03;
export const SUB = 0x04;
export const CMP = 0x05;
export const AND = 0x06;
export const OR = 0x07;
export const XOR = 0x08;
export const ADDS = 0x09;
export const MUL = 0x0a;
export const DIV = 0x0b;
export const MOD = 0x0c;
export const SHLA = 0x10;
export const SHLL = 0x11;
export const SHRA = 0x12;
export const SHRL = 0x13;

// JMP命令はRdの値によって種類が変化する
export const JMP = 0x14;

export const CALL = 0x15;
export const IN = 0x16; // 特権命令
export const OUT = 0x17; // 特権命令

// Rd=0x00ならPUSH命令, Rd=0x04ならPOP命令
export const PUSH_POP = 0x18;

// Rd=0x00ならRET命令, Rd=0x04ならRETI命令
export const RET_RETI = 0x1a;

export const SVC = 0x1e;
export const HALT = 0x1f; // 特権命令
