import { assertIsDefined } from './utils';
import { Tac } from './TaC/tac';

assertIsDefined(document.getElementById('console'));
const canvas = document.getElementById('console') as HTMLCanvasElement;

assertIsDefined(document.getElementById('terminal'));
const terminal = document.getElementById('terminal') as HTMLTextAreaElement;

const tac = new Tac(canvas, terminal);

/* TaCコンソールがクリックされた時の動作 */
canvas.addEventListener('mousedown', (e) => {
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;

  tac.onClick(x, y);
});

const openBtn = document.getElementById('btn-openFile');
assertIsDefined(openBtn);

/* 「Open a File」ボタンが押された時の動作 */
openBtn.addEventListener('click', async () => {
  const filePathElement = document.getElementById('filePath');
  assertIsDefined(filePathElement);

  const loadingMsg = document.getElementById('loading');
  assertIsDefined(loadingMsg);

  const filePath = await window.electronAPI.getSDImagePath();

  if (filePath === undefined) {
    if (window.electronAPI.isSDImageLoaded()) {
      return;
    }
    filePathElement.innerText = 'ファイルが選択されていません';
  } else {
    /* ファイルの読み込みが完了するまで「しばらくお待ちください」を表示する */
    loadingMsg.style.display = 'block';
    window.electronAPI
      .openFile(filePath)
      .then(() => {
        loadingMsg.style.display = 'none';
        filePathElement.innerText = filePath;
      })
      .catch(() => {
        console.log('ファイルが正常に読み込まれませんでした');
      });
  }
});
