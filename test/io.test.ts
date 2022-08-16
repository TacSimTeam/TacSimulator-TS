import { IOMap } from '../src/renderer/TaC/io/ioMap';

test('I/O Map Read/Write Test', () => {
  const map = new IOMap();

  map.write16(0x00, 0xaaaa);
  expect(map.read16(0x00)).toBe(0xaaaa);
  map.write16(0xfe, 0x5555);
  expect(map.read16(0xfe)).toBe(0x5555);
});
