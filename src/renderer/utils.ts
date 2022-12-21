/**
 * 数値を16進数表現の文字列に変換する
 * 先頭に'0x'が付く
 *
 * @param val 変換したい数値
 * @param maxByte 表示したいバイト数(省略すると2)
 *                例) val = 0x23, maxByte = 2のときは
 *                    '0x0023'のように2バイト長になるように0埋めする
 * @returns 16進数に変換した文字列
 */
export function toHexString(val: number, prefix?: string, maxByte?: number): string {
  if (prefix === undefined) {
    prefix = '0x';
  }

  if (maxByte === undefined) {
    maxByte = 2;
  }

  return prefix + val.toString(16).padStart(maxByte * 2, '0');
}
