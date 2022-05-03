export interface IElectronAPI {
  readSector: (sectorNum: number) => Uint8Array;
  writeSector: (sectorNum: number, data: Uint8Array) => void;
  openFile: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
