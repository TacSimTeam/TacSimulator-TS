import { TlbEntry, tlbObjToNum, tlbNumToObj } from '../src/renderer/TaC/memory/tlb';

test('tlbObjToNum() Test', () => {
  let entryObj: TlbEntry = {
    page: 0x22,
    frame: 0xcc,
    validFlag: true,
    referenceFlag: false,
    dirtyFlag: true,
    readFlag: false,
    writeFlag: true,
    executeFlag: false,
  };
  let entryNum = 0x00228acc;

  expect(tlbObjToNum(entryObj)).toBe(entryNum);

  entryObj = {
    page: 0xaa,
    frame: 0xdd,
    validFlag: false,
    referenceFlag: true,
    dirtyFlag: false,
    readFlag: true,
    writeFlag: false,
    executeFlag: true,
  };
  entryNum = 0x00aa15dd;

  expect(tlbObjToNum(entryObj)).toBe(entryNum);
});

test('tlbNumToObj() Test', () => {
  const entryNum = 0x00aa15ee;
  const entryObj: TlbEntry = {
    page: 0xaa,
    frame: 0xee,
    validFlag: false,
    referenceFlag: true,
    dirtyFlag: false,
    readFlag: true,
    writeFlag: false,
    executeFlag: true,
  };

  expect(tlbNumToObj(entryNum)).toStrictEqual(entryObj);
});
