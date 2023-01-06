/**
 * データバスを表現するインターフェース
 *
 * CPUはこのインターフェースを実装するメモリ(MMU)を参照する
 * メモリ関連の割込み、例外は全てこのインターフェースを実装するクラスから発生させる
 */
export interface IDataBus {
  /**
   * バイトデータをメモリから読み込む
   *
   * バイト・レジスタインダイレクトモードでしか使わないので
   * 基本的にはread16()を使ってください
   *
   * @param addr 読み込むデータのアドレス
   * @return 8bitデータ
   */
  read8(addr: number): number;

  /**
   * バイトデータをメモリに書き込む
   *
   * バイト・レジスタインダイレクトモードでしか使わないので
   * 基本的にはwrite16()を使ってください
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたい8bitデータ
   */
  write8(addr: number, val: number): void;

  /**
   * 16bitのデータをメモリから読み込む
   *
   * 以下の状況のときはErrorをthrowするので処理する必要がある
   * - TLBミスが発生したとき
   *
   * @param addr 読み込むデータのアドレス
   * @return 16bitデータ
   */
  read16(addr: number): number;

  /**
   * 16bitのデータをメモリに書き込む
   *
   * 以下の状況のときはErrorをthrowするので処理する必要がある
   * - TLBミスが発生したとき
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたい16bitデータ
   */
  write16(addr: number, val: number): void;

  /**
   * 16bitのデータをメモリから読み込む
   *
   * read16()関数とほぼ変わらないが
   * この関数経由でデータを読みだすと、TLBのexecuteフラグがチェックされる
   *
   * 以下の状況のときはErrorをthrowするので処理する必要がある
   * - TLBミスが発生したとき
   *
   * @param addr 読み込むデータのアドレス
   * @return 16bitデータ
   */
  fetch(pc: number): number;
}
