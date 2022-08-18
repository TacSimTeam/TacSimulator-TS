import { Register, REGISTER_FP, REGISTER_G0, REGISTER_SP, REGISTER_USP } from '../src/renderer/TaC/cpu/register';

test('Register Read/Write Test', () => {
  const register = new Register();

  register.writeReg(REGISTER_G0, 0x1234);
  expect(register.readReg(REGISTER_G0)).toBe(0x1234);
  register.writeReg(REGISTER_FP, 0x2345);
  expect(register.readReg(REGISTER_FP)).toBe(0x2345);
  register.writeReg(REGISTER_SP, 0x3456);
  expect(register.readReg(REGISTER_SP)).toBe(0x3456);
  expect(register.readReg(REGISTER_USP)).toBe(0x3456);

  register.setPrivMode(true);
  register.writeReg(REGISTER_SP, 0x6543);
  expect(register.readReg(REGISTER_SP)).toBe(0x6543);
  expect(register.readReg(REGISTER_USP)).toBe(0x3456);

  register.setPrivMode(false);
  expect(register.readReg(REGISTER_SP)).toBe(0x3456);

  register.writeReg(REGISTER_USP, 0x5678);
  expect(register.readReg(REGISTER_SP)).toBe(0x5678);

  register.reset();
  register.setPrivMode(true);
  expect(register.readReg(REGISTER_G0)).toBe(0);
  expect(register.readReg(REGISTER_USP)).toBe(0);
  expect(register.readReg(REGISTER_SP)).toBe(0);
});
