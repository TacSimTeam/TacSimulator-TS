/**
 * Electronアプリのプリロードスクリプト
 * レンダラープロセスに公開する機能(FileI/Oなど)をここで定義し指定する
 *
 * もし機能を追加したい場合はこのファイルに新しく関数を定義して、
 * contextBridge.exposeInMainWorldの第2引数のオブジェクトに追加する
 * (コード補完を効かせるためにはsrc/renderer/types/renderer.d.tsに型定義を追記する)
 */
import { contextBridge, ipcRenderer, app } from 'electron';
import { SDImgIOAsync } from './sdImgIOAsync';

const sdImgIO = new SDImgIOAsync();

/* レンダラープロセスに公開するAPI */
contextBridge.exposeInMainWorld('electronAPI', {
  readSct: async (sctAddr: number) => {
    return sdImgIO.readSct(sctAddr);
  },
  writeSct: async (sctAddr: number, data: Uint8Array) => {
    await sdImgIO.writeSct(sctAddr, data);
  },
  openFile: async (filePath: string) => {
    await sdImgIO.open(filePath);
  },
  isSDImgLoaded: () => {
    return sdImgIO.isLoaded();
  },
  getSDImgPath: async () => {
    return ipcRenderer.invoke('dialog:getSDImagePath');
  },
});

/* アプリ終了時にファイルをクローズする */
app.on('quit', () => {
  sdImgIO.close();
});
