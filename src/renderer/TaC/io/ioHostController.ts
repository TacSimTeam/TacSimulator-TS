import { IIOHostController } from '../interface';
import { IIOMap } from '../interface';

export class IOHostController implements IIOHostController {
  private ioMap: IIOMap;

  constructor(ioMap: IIOMap) {
    this.ioMap = ioMap;
  }

  input(addr: number): number {
    return this.ioMap.read16(addr);
  }

  output(addr: number, val: number): void {
    this.ioMap.write16(addr, val);
  }
}
