/**
 * Electronアプリのプリロードスクリプト
 * レンダラープロセスに公開する機能(FileIOなど)をここで定義し指定する
 *
 * もし機能を追加したい場合はこのファイルに新しく関数を定義して、
 * contextBridge.exposeInMainWorldの第2引数のオブジェクトに追加する
 * (コード補完を効かせるためにはsrc/renderer/types/renderer.d.tsに型定義を追記する)
 */
import { contextBridge, ipcRenderer } from 'electron';
import { SDCardImageIOAsync } from './sdImageIOAsync';

const sdImgIO = new SDCardImageIOAsync();

/* レンダラープロセスに公開するAPI */
contextBridge.exposeInMainWorld('electronAPI', {
  readSector: (sectorNum: number) => {
    return sdImgIO.readSector(sectorNum);
  },
  writeSector: async (sectorNum: number, data: Uint8Array) => {
    await sdImgIO.writeSector(sectorNum, data);
  },
  openFile: async (filepath: string) => {
    await sdImgIO.open(filepath);
  },
  isSDImageLoaded: () => {
    return sdImgIO.isLoaded();
  },
  getSDImagePath: () => {
    return ipcRenderer.invoke('dialog:getSDImagePath');
  },
});
