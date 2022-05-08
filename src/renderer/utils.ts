/**
 * null(undefined)チェック用関数
 * もしvalがnullかundefinedなら例外を投げる
 *
 * @param val 検査対象の変数
 */
export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}
