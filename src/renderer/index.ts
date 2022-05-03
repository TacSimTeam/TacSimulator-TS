import { Console } from './console/console';

const canvas = <HTMLCanvasElement>document.getElementById('console');
const ctx = canvas.getContext('2d');

if (ctx !== null) {
  const console = new Console(ctx);
  console.drawAll();
} else {
  console.log('error : loading console failed');
}

const btn = document.getElementById('btn-openFile');
const filePathElement = document.getElementById('filePath');

btn?.addEventListener('click', async () => {
  let text: string;
  const filePath = await window.electronAPI.getSDImagePath();
  if (filePath === undefined) {
    text = 'ファイルが選択されていません';
    return;
  } else {
    window.electronAPI.openFile(filePath);
    text = filePath;
  }

  if (filePathElement !== null) {
    filePathElement.innerText = text;
  }
});
