import { toHexString } from '../src/renderer/util/lib';

test('Convert number to hex string test', () => {
  expect(toHexString(0x0001)).toBe('0x0001');
  expect(toHexString(0x0011)).toBe('0x0011');
  expect(toHexString(0x0111)).toBe('0x0111');
  expect(toHexString(0x1111)).toBe('0x1111');

  expect(toHexString(0x0001, 'abc')).toBe('abc0001');
  expect(toHexString(0x0011, 'abc')).toBe('abc0011');
  expect(toHexString(0x0111, 'abc')).toBe('abc0111');
  expect(toHexString(0x1111, 'abc')).toBe('abc1111');

  expect(toHexString(0x0001, '0x', 4)).toBe('0x00000001');
  expect(toHexString(0x0011, '0x', 4)).toBe('0x00000011');
  expect(toHexString(0x0111, '0x', 4)).toBe('0x00000111');
  expect(toHexString(0x1111, '0x', 4)).toBe('0x00001111');
});
