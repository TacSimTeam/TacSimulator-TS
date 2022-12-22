import { TlbEntry } from '../src/renderer/TaC/memory/tlb';

test('TLB utility function test', () => {
  const entry = new TlbEntry(0x00aaffbb);

  expect(entry.getHigh8()).toBe(0xaa);
  expect(entry.getLow16()).toBe(0xffbb);

  entry.setHigh8(0x22);
  expect(entry.getHigh8()).toBe(0x22);

  entry.setLow16(0xff44);
  expect(entry.getLow16()).toBe(0xff44);

  entry.setHigh8(0xaa);
  entry.setLow16(0xffbb);
  expect(entry.getPage()).toBe(0xaa);
  expect(entry.getFrame()).toBe(0xbb);

  expect(entry.isValid()).toBe(true);
  expect(entry.isRefered()).toBe(true);
  expect(entry.isDirty()).toBe(true);
  expect(entry.isReadable()).toBe(true);
  expect(entry.isWritable()).toBe(true);
  expect(entry.isExecutable()).toBe(true);
});
