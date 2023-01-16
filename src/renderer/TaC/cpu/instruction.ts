export interface Instruction {
  opcode: number; // 命令
  addrMode: number; // アドレッシングモード
  rd: number; // ディスティネーションレジスタ
  rx: number; // インデクスレジスタ
  ea: number; // 実効アドレス
}
