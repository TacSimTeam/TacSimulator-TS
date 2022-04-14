import { app, BrowserWindow } from 'electron';

function createWindow() {
  const options: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 800,
    webPreferences: { nodeIntegration: true },
  };
  const win = new BrowserWindow(options);
  win.loadFile('public/index.html');
}

// Electron の初期化が完了したらウィンドウを作成
app.whenReady().then(createWindow);
