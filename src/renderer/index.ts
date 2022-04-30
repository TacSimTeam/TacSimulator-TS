import { Console } from './console/console';

const canvas = <HTMLCanvasElement>document.getElementById('console');
const ctx = canvas.getContext('2d');

if (ctx !== null) {
  const console = new Console(ctx);
  console.drawAll();
} else {
  console.log('error : loading console failed');
}
