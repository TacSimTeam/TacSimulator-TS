export type Instruction = {
  opcode: number /* 命令 */;
  addrMode: number /* アドレッシングモード */;
  rd: number /* ディスティネーションレジスタ */;
  rx: number /* インデクスレジスタ */;
  dsp: number /* 実効アドレス */;
};
