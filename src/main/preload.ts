/**
 * Electronアプリのプリロードスクリプト
 * レンダラープロセスに公開する機能(FileIOなど)をここで定義し指定する
 *
 * もし機能を追加したい場合はこのファイルに新しく関数を定義して、
 * contextBridge.exposeInMainWorldの第2引数のオブジェクトに追加する
 * (コード補完を効かせるためにはsrc/renderer/types/renderer.d.tsに型定義を追記する)
 */
import { contextBridge, ipcRenderer } from 'electron';
import { SDCardImageIO } from './sdCardImageIO';

const sdImgIO = new SDCardImageIO();

/* ファイル選択ウィンドウを表示し、選択されたdmgファイルのパスを返す */
function getSDImagePath() {
  return ipcRenderer.invoke('dialog:getSDImagePath');
}

/* レンダラープロセスに公開するAPI */
contextBridge.exposeInMainWorld('electronAPI', {
  readSector: sdImgIO.readSectorSync,
  writeSector: sdImgIO.writeSectorSync,
  openFile: sdImgIO.open,
  isSDImageLoaded: sdImgIO.isLoaded,
  getSDImagePath: getSDImagePath,
});
