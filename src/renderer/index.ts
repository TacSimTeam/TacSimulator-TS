import { assertIsDefined } from './utils';
import { Tac } from './TaC/tac';

assertIsDefined(document.getElementById('console'));
const canvas = document.getElementById('console') as HTMLCanvasElement;

const ctx = canvas.getContext('2d');
assertIsDefined(ctx);

const tac = new Tac(ctx);

const openBtn = document.getElementById('btn-openFile');
assertIsDefined(openBtn);

const filePathElement = document.getElementById('filePath');
assertIsDefined(filePathElement);

const loadingMsg = document.getElementById('loading');
assertIsDefined(loadingMsg);

// 「Open a File」ボタンが押された時の動作
openBtn.addEventListener('click', async () => {
  let text: string;
  const filePath = await window.electronAPI.getSDImagePath();

  if (filePath === undefined) {
    text = 'ファイルが選択されていません';
  } else {
    // 「しばらくお待ちください」を表示する
    loadingMsg.style.display = 'block';
    window.electronAPI.openFile(filePath);
    text = filePath;
    loadingMsg.style.display = 'none';
  }

  if (filePathElement !== null) {
    filePathElement.innerText = text;
  }
});

// TaCコンソールがクリックされた時の動作
canvas.addEventListener('mousedown', (e) => {
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;

  tac.onClick(x, y);
});
