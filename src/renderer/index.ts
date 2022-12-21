import { Tac } from './TaC/tac';
import { querySelector } from './util/dom.result';

const console = querySelector<HTMLCanvasElement>('#console').unwrap();
const terminal = querySelector<HTMLTextAreaElement>('#terminal').unwrap();

const tac = new Tac(console, terminal);

/* TaCコンソールがクリックされた時の動作 */
console.addEventListener('mousedown', (e) => {
  const x = e.clientX - console.getBoundingClientRect().left;
  const y = e.clientY - console.getBoundingClientRect().top;

  tac.onClick(x, y);
});

const btnOpen = querySelector<HTMLButtonElement>('#btn-openFile').unwrap();

/* 「Open a File」ボタンが押された時の動作 */
btnOpen.addEventListener('click', () => {
  const filePathElement = querySelector<HTMLElement>('#filePath').unwrap();

  window.electronAPI
    .getSDImgPath()
    .then((filePath) => {
      if (filePath === undefined) {
        return;
      }

      window.electronAPI
        .openFile(filePath)
        .then(() => {
          filePathElement.innerText = filePath;
        })
        .catch(() => {
          alert('ファイルが正常に読み込まれませんでした');
        });
    })
    .catch(() => {
      alert('ファイルが正常に読み込まれませんでした');
    });
});
