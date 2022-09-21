/**
 * レジスタが実装するインターフェース
 */
export interface IRegister {
  /**
   * 指定した番号のレジスタの値を読み込む
   */
  read(num: number): number;

  /**
   * 指定した番号のレジスタに書き込む
   */
  write(num: number, val: number): void;
}
