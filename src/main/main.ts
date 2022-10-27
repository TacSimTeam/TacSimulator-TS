import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow;

const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;

/**
 * ウィンドウを生成し, HTMLを読み込んで表示する
 */
function createWindow() {
  const options: Electron.BrowserWindowConstructorOptions = {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  };
  mainWindow = new BrowserWindow(options);
  mainWindow.loadFile('public/index.html');

  /* レンダリング終了後にウィンドウを表示する */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

/* Electron の初期化完了を待ってからウィンドウを作成 */
app.whenReady().then(() => {
  ipcMain.handle('dialog:getSDImagePath', handleGetSDImgPath);
  createWindow();
});

/* ウィンドウが全て閉じられたときアプリが終了させる(macOS以外) */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/**
 * ファイルダイアログを開き「.dmg」ファイルのパスを返す
 */
async function handleGetSDImgPath() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'ファイルを選択してください',
    filters: [{ name: 'SDイメージファイル', extensions: ['dmg'] }],
  });

  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}
