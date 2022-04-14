import fs from 'fs';
import { contextBridge } from 'electron';

const SECTOR_SIZE = 512;
const DEFAULT_SD_IMAGE_FILEPATH = 'public/TacOS.dmg';

const buf = Buffer.alloc(SECTOR_SIZE);
let fd: number;
try {
  fd = fs.openSync(DEFAULT_SD_IMAGE_FILEPATH, 'r+');
  console.log('preload.js | fd : ' + fd + ', filename : ' + DEFAULT_SD_IMAGE_FILEPATH);
} catch (e) {
  console.log(e);
}

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

contextBridge.exposeInMainWorld('electron', {
  readSector: readSector,
  writeSector: writeSector,
});
