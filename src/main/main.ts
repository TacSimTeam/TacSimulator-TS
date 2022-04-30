import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  const options: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  };
  const win = new BrowserWindow(options);
  win.loadFile('public/index.html');

  // レンダリング終了後にウィンドウを表示する
  win.once('ready-to-show', () => {
    win.show();
  });
}

// Electron の初期化が完了したらウィンドウを作成
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ウィンドウが全て閉じられたときアプリが終了させる(macOS以外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
