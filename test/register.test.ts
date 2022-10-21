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

  register.write(REGISTER_G0, 1);
  expect(register.read(REGISTER_G0)).toBe(1);
  register.write(REGISTER_G1, 1);
  expect(register.read(REGISTER_G1)).toBe(1);
  register.write(REGISTER_G2, 1);
  expect(register.read(REGISTER_G2)).toBe(1);
  register.write(REGISTER_G3, 1);
  expect(register.read(REGISTER_G3)).toBe(1);
  register.write(REGISTER_G4, 1);
  expect(register.read(REGISTER_G4)).toBe(1);
  register.write(REGISTER_G5, 1);
  expect(register.read(REGISTER_G5)).toBe(1);
  register.write(REGISTER_G6, 1);
  expect(register.read(REGISTER_G6)).toBe(1);
  register.write(REGISTER_G7, 1);
  expect(register.read(REGISTER_G7)).toBe(1);
  register.write(REGISTER_G8, 1);
  expect(register.read(REGISTER_G8)).toBe(1);
  register.write(REGISTER_G9, 1);
  expect(register.read(REGISTER_G9)).toBe(1);
  register.write(REGISTER_G10, 1);
  expect(register.read(REGISTER_G10)).toBe(1);
  register.write(REGISTER_G10, 1);
  expect(register.read(REGISTER_G10)).toBe(1);
  register.write(REGISTER_G10, 1);
  expect(register.read(REGISTER_G10)).toBe(1);
  register.write(REGISTER_G11, 1);
  expect(register.read(REGISTER_G11)).toBe(1);
  register.write(REGISTER_FP, 1);
  expect(register.read(REGISTER_FP)).toBe(1);

  /* SP(USP, SSP)テスト */
  register.write(REGISTER_SP, 2);
  expect(register.read(REGISTER_SP)).toBe(2);
  expect(register.read(REGISTER_USP)).toBe(2);

  privsig.setPrivMode(true);
  register.write(REGISTER_SP, 3);
  expect(register.read(REGISTER_SP)).toBe(3);
  expect(register.read(REGISTER_USP)).toBe(2);

  privsig.setPrivMode(false);
  expect(register.read(REGISTER_SP)).toBe(2);
});
