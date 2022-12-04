import { Register } from '../src/renderer/TaC/cpu/register';
import * as regNum from '../src/renderer/TaC/cpu/const/regNum';
import { Psw } from '../src/renderer/TaC/cpu/psw';

test('Register read/write test', () => {
  const psw = new Psw();
  const register = new Register(psw);

  psw.setPrivFlag(false);

  register.write(regNum.G0, 1);
  expect(register.read(regNum.G0)).toBe(1);
  register.write(regNum.G1, 1);
  expect(register.read(regNum.G1)).toBe(1);
  register.write(regNum.G2, 1);
  expect(register.read(regNum.G2)).toBe(1);
  register.write(regNum.G3, 1);
  expect(register.read(regNum.G3)).toBe(1);
  register.write(regNum.G4, 1);
  expect(register.read(regNum.G4)).toBe(1);
  register.write(regNum.G5, 1);
  expect(register.read(regNum.G5)).toBe(1);
  register.write(regNum.G6, 1);
  expect(register.read(regNum.G6)).toBe(1);
  register.write(regNum.G7, 1);
  expect(register.read(regNum.G7)).toBe(1);
  register.write(regNum.G8, 1);
  expect(register.read(regNum.G8)).toBe(1);
  register.write(regNum.G9, 1);
  expect(register.read(regNum.G9)).toBe(1);
  register.write(regNum.G10, 1);
  expect(register.read(regNum.G10)).toBe(1);
  register.write(regNum.G10, 1);
  expect(register.read(regNum.G10)).toBe(1);
  register.write(regNum.G10, 1);
  expect(register.read(regNum.G10)).toBe(1);
  register.write(regNum.G11, 1);
  expect(register.read(regNum.G11)).toBe(1);
  register.write(regNum.FP, 1);
  expect(register.read(regNum.FP)).toBe(1);

  /* SP(USP, SSP)テスト */
  register.write(regNum.SP, 2);
  expect(register.read(regNum.SP)).toBe(2);
  expect(register.read(regNum.USP)).toBe(2);

  psw.setPrivFlag(true);
  register.write(regNum.SP, 3);
  expect(register.read(regNum.SP)).toBe(3);
  expect(register.read(regNum.USP)).toBe(2);

  psw.setPrivFlag(false);
  expect(register.read(regNum.SP)).toBe(2);
});
