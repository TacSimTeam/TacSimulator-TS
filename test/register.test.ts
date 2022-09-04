import {
  Register,
  REGISTER_G0,
  REGISTER_G1,
  REGISTER_G2,
  REGISTER_G3,
  REGISTER_G4,
  REGISTER_G5,
  REGISTER_G6,
  REGISTER_G7,
  REGISTER_G8,
  REGISTER_G9,
  REGISTER_G10,
  REGISTER_G11,
  REGISTER_FP,
  REGISTER_SP,
  REGISTER_USP,
} from '../src/renderer/TaC/cpu/register';
import { PrivModeSignal } from '../src/renderer/TaC/cpu/privModeSignal';

test('Register read/write test', () => {
  const privsig = new PrivModeSignal();
  const register = new Register(privsig);

  privsig.setPrivMode(false);

  register.writeReg(REGISTER_G0, 0x1234);
  expect(register.readReg(REGISTER_G0)).toBe(0x1234);
  register.writeReg(REGISTER_G1, 0x1234);
  expect(register.readReg(REGISTER_G1)).toBe(0x1234);
  register.writeReg(REGISTER_G2, 0x1234);
  expect(register.readReg(REGISTER_G2)).toBe(0x1234);
  register.writeReg(REGISTER_G3, 0x1234);
  expect(register.readReg(REGISTER_G3)).toBe(0x1234);
  register.writeReg(REGISTER_G4, 0x1234);
  expect(register.readReg(REGISTER_G4)).toBe(0x1234);
  register.writeReg(REGISTER_G5, 0x1234);
  expect(register.readReg(REGISTER_G5)).toBe(0x1234);
  register.writeReg(REGISTER_G6, 0x1234);
  expect(register.readReg(REGISTER_G6)).toBe(0x1234);
  register.writeReg(REGISTER_G7, 0x1234);
  expect(register.readReg(REGISTER_G7)).toBe(0x1234);
  register.writeReg(REGISTER_G8, 0x1234);
  expect(register.readReg(REGISTER_G8)).toBe(0x1234);
  register.writeReg(REGISTER_G9, 0x1234);
  expect(register.readReg(REGISTER_G9)).toBe(0x1234);
  register.writeReg(REGISTER_G10, 0x1234);
  expect(register.readReg(REGISTER_G10)).toBe(0x1234);
  register.writeReg(REGISTER_G10, 0x1234);
  expect(register.readReg(REGISTER_G10)).toBe(0x1234);
  register.writeReg(REGISTER_G10, 0x1234);
  expect(register.readReg(REGISTER_G10)).toBe(0x1234);
  register.writeReg(REGISTER_G11, 0x1234);
  expect(register.readReg(REGISTER_G11)).toBe(0x1234);
  register.writeReg(REGISTER_FP, 0x2345);
  expect(register.readReg(REGISTER_FP)).toBe(0x2345);

  /* SP(USP, SSP)テスト */
  register.writeReg(REGISTER_SP, 0x3456);
  expect(register.readReg(REGISTER_SP)).toBe(0x3456);
  expect(register.readReg(REGISTER_USP)).toBe(0x3456);

  privsig.setPrivMode(true);
  register.writeReg(REGISTER_SP, 0x6543);
  expect(register.readReg(REGISTER_SP)).toBe(0x6543);
  expect(register.readReg(REGISTER_USP)).toBe(0x3456);

  privsig.setPrivMode(false);
  expect(register.readReg(REGISTER_SP)).toBe(0x3456);

  register.writeReg(REGISTER_USP, 0x5678);
  expect(register.readReg(REGISTER_SP)).toBe(0x5678);
});
