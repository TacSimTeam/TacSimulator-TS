import { IIOMap } from './ioMap';

/**
 * TaCの周辺機器を表現するインターフェース
 *
 * 新たなI/O機器を実装する場合にはこのインターフェースを元に作る
 */
export interface IIODevice {
  /**
   * 周辺装置の初期化を行う
   *
   * @param ioMap 装置が値を参照するI/Oマップへの参照
   */
  init(ioMap: IIOMap): void;

  /**
   * 周辺装置の内部データの更新する
   *
   * I/Oマップの値が書き替えられたときに呼び出され
   * この関数の中で値の更新、設定を行う
   */
  update(): void;
}
