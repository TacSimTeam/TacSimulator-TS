/**
 * データバスを表現するインターフェース
 *
 * CPUはこのインターフェースを実装するメモリ(MMU)を参照する
 * メモリ関連の割込み、例外は全てこのインターフェースを実装するクラスから発生させる
 */
export interface IDataBus {
  /**
   * 16bitのデータをメモリに書き込む
   *
   * 以下の状況のときはErrorをthrowするので処理する必要がある
   * - TLBミスが発生したとき
   *
   * @param addr 書き込み先のアドレス
   * @param val  書き込みたいデータ(16bit)
   */
  write16(addr: number, val: number): void;

  /**
   * 16bitのデータをメモリから読み込む
   *
   * 以下の状況のときはErrorをthrowするので処理する必要がある
   * - TLBミスが発生したとき
   *
   * @param addr 読み込むデータのアドレス
   */
  read16(addr: number): number;

  /**
   * バイトデータをメモリに書き込む
   *
   * バイト・レジスタインダイレクトモードでしか使わないので
   * 基本的にはwrite16()を使ってください
   *
   * @param addr
   * @param val  書き込みたいデータ(8bit)
   */
  write8(addr: number, val: number): void;

  /**
   * バイトデータをメモリから読み込む
   *
   * バイト・レジスタインダイレクトモードでしか使わないので
   * 基本的にはread16()を使ってください
   *
   * @param addr
   */
  read8(addr: number): number;
}
