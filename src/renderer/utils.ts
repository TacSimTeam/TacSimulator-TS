/**
 * null(undefined)チェック用関数
 * もしvalがnullかundefinedなら例外を投げる
 *
 * 返り値がnullやundefinedの可能性のある関数を使用する際には
 * この関数を使ってnullチェックをしてください
 *
 * @param val 検査対象の変数
 */
export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}
