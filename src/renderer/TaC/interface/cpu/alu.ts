/**
 * ALUを表現するインターフェース
 */
export interface IAlu {
  /**
   * opの値に応じてv1とv2に何らかの演算をして結果を返す
   */
  calc(op: number, v1: number, v2: number): number;
}
