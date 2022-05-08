import * as fs from 'fs';
import { contextBridge, ipcRenderer } from 'electron';

const SECTOR_SIZE = 512;

const buf = Buffer.alloc(SECTOR_SIZE);
let fd = 0;

function readSector(sectorNum: number) {
  fs.readSync(fd, buf, 0, SECTOR_SIZE, sectorNum * SECTOR_SIZE);
  return Uint8Array.from(buf);
}

function writeSector(sectorNum: number, data: Uint8Array) {
  try {
    fs.writeSync(fd, data, sectorNum * SECTOR_SIZE);
  } catch (e) {
    console.log(e);
  }
}

function getSDImagePath() {
  return ipcRenderer.invoke('dialog:getSDImagePath');
}

function openFile(filePath: string) {
  try {
    fd = fs.openSync(filePath, 'r+');
    console.log('fd : ' + fd + ', filename : ' + filePath);
  } catch (e) {
    console.log(e);
  }
}

function isSDImageLoaded() {
  if (fd === 0) {
    return false;
  } else {
    return true;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  readSector: readSector,
  writeSector: writeSector,
  getSDImagePath: getSDImagePath,
  openFile: openFile,
  isSDImageLoaded: isSDImageLoaded,
});
