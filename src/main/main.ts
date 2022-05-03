import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow;

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'ファイルを選択してください',
  });

  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

function createWindow() {
  const options: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  };
  mainWindow = new BrowserWindow(options);
  mainWindow.loadFile('public/index.html');

  // レンダリング終了後にウィンドウを表示する
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Electron の初期化が完了したらウィンドウを作成
app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ウィンドウが全て閉じられたときアプリが終了させる(macOS以外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
