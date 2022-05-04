import { Console } from './console/console';

const canvas = <HTMLCanvasElement>document.getElementById('console');
const ctx = canvas.getContext('2d');

let tacConsole: Console;

if (ctx !== null) {
  tacConsole = new Console(ctx);
  tacConsole.drawAll();
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

canvas.addEventListener('mousedown', (e) => {
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;

  tacConsole.click(x, y);
});
