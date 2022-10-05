/**
 * ALUを表現するインターフェース
 */
export interface IAlu {
  /**
   * opの値に応じてv1とv2に何らかの演算をして結果を返す
   *
   * @param op 演算
   * @param v1 16bit整数
   * @param v2 16bit整数
   * @return 演算結果(16bitに正規化せずに返すことに注意)
   */
  calc(op: number, v1: number, v2: number): number;
}
