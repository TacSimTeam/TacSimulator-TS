/* レンダラープロセスに公開するAPIの型定義 */
export interface IElectronAPI {
  readSct(sctAddr: number): Promise<Uint8Array>;
  writeSct(sctAddr: number, data: Uint8Array): Promise<void>;
  openFile(filePath: string): Promise<void>;
  isSDImgLoaded(): boolean;
  getSDImgPath(): Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
