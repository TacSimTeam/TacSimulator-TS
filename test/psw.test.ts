import { Psw } from '../src/renderer/TaC/cpu/psw';
import * as flag from '../src/renderer/TaC/cpu/const/flag';

test('PSW PC += 2 test', () => {
  const psw = new Psw();
  const spyLog = jest.spyOn(console, 'warn');

  /* テスト時にconsole.warn()の出力を出さないようにする */
  spyLog.mockImplementation((x) => x);

  psw['pc'] = 0x0000;
  psw.nextPC();
  expect(psw.getPC()).toBe(0x0002);

  /* PCが0xffffを超えるときに出力する警告が出るかどうか */
  psw['pc'] = 0xfffe;
  psw.nextPC();
  expect(console.warn).toBeCalled();
  expect(spyLog.mock.calls[0][0]).toEqual(
    'このnextPC()呼び出しによって、PCの値が0xffffを超えてしまいます'
  );

  spyLog.mockRestore();
});

test('PSW jump test', () => {
  const psw = new Psw();
  const spyLog = jest.spyOn(console, 'warn');

  /* テスト時にconsole.warn()の出力を出さないようにする */
  spyLog.mockImplementation((x) => x);

  psw['pc'] = 0x0000;
  psw.jumpTo(0x1000);
  expect(psw.getPC()).toBe(0x1000);

  /* PCが0xffffを超えるときに出力する警告が出るかどうか */
  psw['pc'] = 0x0000;
  psw.jumpTo(0x10000);
  expect(console.warn).toBeCalled();
  expect(spyLog.mock.calls[0][0]).toEqual('TaCのメモリの範囲外にジャンプしようとしています');

  spyLog.mockReset();

  /* 奇数アドレスを指定したときに警告が出るかどうか */
  psw['pc'] = 0x0000;
  psw.jumpTo(0x1111);
  expect(console.warn).toBeCalled();
  expect(spyLog.mock.calls[0][0]).toEqual('奇数番地にジャンプしようとしています');

  spyLog.mockRestore();
});

test('PSW evaluation flag test', () => {
  const psw = new Psw();

  expect(psw.checkFlag(flag.ZERO)).toBe(false);
  psw['flags'] = flag.ZERO;
  expect(psw.checkFlag(flag.ZERO)).toBe(true);

  expect(psw.checkFlag(flag.SIGN)).toBe(false);
  psw['flags'] |= flag.SIGN;
  expect(psw.checkFlag(flag.SIGN)).toBe(true);

  expect(psw.checkFlag(flag.ENABLE_INTR)).toBe(false);
  psw['flags'] |= flag.ENABLE_INTR;
  expect(psw.checkFlag(flag.ENABLE_INTR)).toBe(true);
});

test('PSW get privileged mode flag test', () => {
  const psw = new Psw();

  psw['flags'] = flag.PRIV;
  expect(psw.getPrivFlag()).toBe(true);

  psw['flags'] = ~flag.PRIV;
  expect(psw.getPrivFlag()).toBe(false);
});

test('PSW set privileged mode flag test', () => {
  const psw = new Psw();

  psw['flags'] = 0x0000;
  expect(psw.getPrivFlag()).toBe(false);
  psw.setPrivFlag(true);
  expect(psw.getPrivFlag()).toBe(true);

  psw['flags'] = ~flag.PRIV;
  expect(psw.getPrivFlag()).toBe(false);
  psw.setPrivFlag(true);
  expect(psw.getPrivFlag()).toBe(true);
});

test('PSW set flags test', () => {
  const psw = new Psw();

  /* ユーザモード or I/O特権モードのとき */
  psw['flags'] = 0x0000;
  psw.setFlags(0xffff);
  expect(psw.getFlags()).toBe(0xff1f);

  psw['flags'] = 0xff1f | flag.ENABLE_INTR | flag.IO_PRIV;
  psw.setFlags(0x0000);
  expect(psw.getFlags()).toBe(flag.ENABLE_INTR | flag.IO_PRIV);

  /* 特権モードのとき */
  psw['flags'] = flag.PRIV;
  psw.setFlags(0xffff);
  expect(psw.getFlags()).toBe(0xffff);
});
