/* IPLを読み込む機器が実装するインターフェース */
export interface IIplLoader {
  /* IPLを読み込む */
  loadIpl(): void;

  /* IPLをメモリから切り離す */
  detachIpl(): void;
}
