export interface IElectronAPI {
  readSector: (sectorNum: number) => Uint8Array;
  writeSector: (sectorNum: number, data: Uint8Array) => void;
  getSDImagePath: () => Promise<string | undefined>;
  openFile: (filePath: string) => void;
  isSDImageLoaded: () => boolean;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
