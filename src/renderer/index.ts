import { assertIsDefined } from './utils';
import { Tac } from './TaC/tac';

const c = document.getElementById('console');
assertIsDefined(c);
const canvas = c as HTMLCanvasElement;

const ctx = canvas.getContext('2d');
assertIsDefined(ctx);

const openBtn = document.getElementById('btn-openFile');
assertIsDefined(openBtn);

const filePathElement = document.getElementById('filePath');
assertIsDefined(filePathElement);

const tac = new Tac(ctx);

// 「Open a File」ボタンが押された時の動作
openBtn.addEventListener('click', async () => {
  let text: string;
  const filePath = await window.electronAPI.getSDImagePath();

  if (filePath === undefined) {
    text = 'ファイルが選択されていません';
  } else {
    window.electronAPI.openFile(filePath);
    text = filePath;
  }

  if (filePathElement !== null) {
    filePathElement.innerText = text;
  }
});

// TaCコンソールがクリックされた時の動作
canvas.addEventListener('mousedown', (e) => {
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;

  tac.click(x, y);
});
