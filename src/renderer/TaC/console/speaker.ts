export class Speaker {
  private aCtx: AudioContext;

  constructor() {
    this.aCtx = new AudioContext();
  }

  /**
   * TaCのボタンを押されたときの音を出す
   */
  buzzer(): void {
    const oscil = this.aCtx.createOscillator();
    oscil.type = 'square'; // 矩形波
    oscil.frequency.setValueAtTime(670, this.aCtx.currentTime); // 670Hz
    oscil.connect(this.aCtx.destination);
    oscil.start();
    oscil.stop(this.aCtx.currentTime + 0.06); // 0.06sだけ鳴らす
  }
}
