/**
 * 数値を16進数表現の文字列に変換する
 * 先頭に'0x'が付く
 *
 * @param val 変換したい数値
 * @param maxByte 表示したいバイト数(省略すると2)
 *                例) val = 0x23, maxByte = 2のときは
 *                    '0x0023'のように2バイト長になるように0埋めする
 * @return 16進数に変換した文字列
 */
export function toHexString(val: number, prefix: string = '0x', maxByte: number = 2): string {
  return prefix + val.toString(16).padStart(maxByte * 2, '0');
}
