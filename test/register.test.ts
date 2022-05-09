import { Register, REGISTER_FP, REGISTER_G0, REGISTER_SP, REGISTER_USP } from '../src/renderer/TaC/cpu/register';

test('Register Read/Write Test', () => {
  const register = new Register();

  expect(() => {
    register.read(-1);
  }).toThrow();
  expect(() => {
    register.read(16);
  }).toThrow();
  expect(() => {
    register.write(-1, 10);
  }).toThrow();
  expect(() => {
    register.write(16, 10);
  }).toThrow();

  register.write(REGISTER_G0, 0x1234);
  expect(register.read(REGISTER_G0)).toBe(0x1234);
  register.write(REGISTER_FP, 0x2345);
  expect(register.read(REGISTER_FP)).toBe(0x2345);
  register.write(REGISTER_SP, 0x3456);
  expect(register.read(REGISTER_SP)).toBe(0x3456);
  expect(register.read(REGISTER_USP)).toBe(0x3456);

  register.setPrivMode(true);
  register.write(REGISTER_SP, 0x6543);
  expect(register.read(REGISTER_SP)).toBe(0x6543);
  expect(register.read(REGISTER_USP)).toBe(0x3456);

  register.setPrivMode(false);
  expect(register.read(REGISTER_SP)).toBe(0x3456);

  register.reset();
  register.setPrivMode(true);
  expect(register.read(REGISTER_G0)).toBe(0);
  expect(register.read(REGISTER_USP)).toBe(0);
  expect(register.read(REGISTER_SP)).toBe(0);
});
