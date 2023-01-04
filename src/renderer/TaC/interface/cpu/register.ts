/**
 * レジスタが実装するインターフェース
 */
export interface IRegister {
  /**
   * 指定した番号のレジスタの値を読み込む
   *
   * @param num レジスタ番号
   * @return 16bitデータ
   */
  read(num: number): number;

  /**
   * 指定した番号のレジスタに書き込む
   */

  /**
   * 指定した番号のレジスタに書き込む
   *
   * @param num レジスタ番号
   * @param val 書き込みたい16bitデータ
   */
  write(num: number, val: number): void;
}
