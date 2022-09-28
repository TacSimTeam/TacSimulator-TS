import { TlbEntry, tlbObjToNum, tlbNumToObj } from '../src/renderer/TaC/memory/tlb';

test('tlbObjToNum() Test', () => {
  let entryObj: TlbEntry = {
    page: 0x22,
    frame: 0xcc,
    validFlag: true,
    undefinedFlag1: true,
    undefinedFlag2: false,
    referenceFlag: false,
    dirtyFlag: true,
    readFlag: false,
    writeFlag: true,
    executeFlag: false,
  };
  let entryNum = 0x0022cacc;

  expect(tlbObjToNum(entryObj)).toBe(entryNum);

  entryObj = {
    page: 0xaa,
    frame: 0xdd,
    validFlag: false,
    undefinedFlag1: false,
    undefinedFlag2: true,
    referenceFlag: true,
    dirtyFlag: false,
    readFlag: true,
    writeFlag: false,
    executeFlag: true,
  };
  entryNum = 0x00aa35dd;

  expect(tlbObjToNum(entryObj)).toBe(entryNum);
});

test('tlbNumToObj() Test', () => {
  const entryNum = 0x00aa75ee;
  const entryObj: TlbEntry = {
    page: 0xaa,
    frame: 0xee,
    validFlag: false,
    undefinedFlag1: true,
    undefinedFlag2: true,
    referenceFlag: true,
    dirtyFlag: false,
    readFlag: true,
    writeFlag: false,
    executeFlag: true,
  };

  expect(tlbNumToObj(entryNum)).toStrictEqual(entryObj);
});
