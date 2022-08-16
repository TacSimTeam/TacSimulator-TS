export type TlbEntry = {
  page: number;
  frame: number;

  validFlag: boolean;
  referenceFlag: boolean;
  dirtyFlag: boolean;
  readFlag: boolean;
  writeFlag: boolean;
  executeFlag: boolean;
};

export function tlbObjToNum(tlbObj: TlbEntry): number {
  let entryNum = tlbObj.frame & 0xff;

  if (tlbObj.validFlag) {
    entryNum |= 1 << 15;
  }
  if (tlbObj.referenceFlag) {
    entryNum |= 1 << 12;
  }
  if (tlbObj.dirtyFlag) {
    entryNum |= 1 << 11;
  }
  if (tlbObj.readFlag) {
    entryNum |= 1 << 10;
  }
  if (tlbObj.writeFlag) {
    entryNum |= 1 << 9;
  }
  if (tlbObj.executeFlag) {
    entryNum |= 1 << 8;
  }

  entryNum |= (tlbObj.page & 0xff) << 16;

  return entryNum;
}

export function tlbNumToObj(tlbNum: number): TlbEntry {
  const entryObj: TlbEntry = {
    page: (tlbNum >> 16) & 0xff,
    frame: tlbNum & 0xff,
    validFlag: !!(tlbNum & (1 << 15)),
    referenceFlag: !!(tlbNum & (1 << 12)),
    dirtyFlag: !!(tlbNum & (1 << 11)),
    readFlag: !!(tlbNum & (1 << 10)),
    writeFlag: !!(tlbNum & (1 << 9)),
    executeFlag: !!(tlbNum & (1 << 8)),
  };
  return entryObj;
}
