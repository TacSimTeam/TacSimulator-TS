/* レンダラープロセスに公開するAPIの型定義 */
export interface IElectronAPI {
  readSector: (sectorNum: number) => Promise<Uint8Array>;
  writeSector: (sectorNum: number, data: Uint8Array) => Promise<void>;
  getSDImagePath: () => Promise<string | undefined>;
  openFile: (filePath: string) => Promise<void>;
  isSDImageLoaded: () => boolean;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
