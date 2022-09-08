/* レンダラープロセスに公開するAPIの型定義 */
export interface IElectronAPI {
  readSector: (sectorNum: number) => Promise<Buffer>;
  writeSector: (sectorNum: number, data: Uint8Array) => Promise<void>;
  openFile: (filepath: string) => Promise<void>;
  isSDImageLoaded: () => boolean;
  getSDImagePath: () => Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
