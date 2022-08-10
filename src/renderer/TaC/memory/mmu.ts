import { IDataBus, IDmaSignal, IIplLoader, IIntrController } from '../interface';
import { ipl } from '../ipl';
import * as intr from '../interrupt/interruptNum';

export class Mmu implements IDataBus, IDmaSignal, IIplLoader {
  private memory: IDmaSignal;
  private intrController: IIntrController;

  /* IPLロード中ならtrue */
  private iplMode: boolean;

  constructor(memory: IDmaSignal, intrController: IIntrController) {
    this.memory = memory;
    this.intrController = intrController;
    this.iplMode = false;
  }

  write8(addr: number, val: number) {
    this.memory.write8(addr, val);
  }

  read8(addr: number) {
    return this.memory.read8(addr);
  }

  write16(addr: number, val: number) {
    if (addr % 2 == 1) {
      this.intrController.interrupt(intr.EXCP_MEMORY_ERROR);
      return;
    } else if (this.iplMode) {
      if (addr >= 0xe000) {
        console.log('IPLロード中は0xe000~0xffffがReadonlyです');
        return;
      }
    }

    this.memory.write8(addr, (val & 0xff00) >> 8);
    this.memory.write8(addr + 1, val & 0x00ff);
  }

  read16(addr: number) {
    if (addr % 2 == 1) {
      this.intrController.interrupt(intr.EXCP_MEMORY_ERROR);
      return 0;
    }

    return (this.memory.read8(addr) << 8) | this.memory.read8(addr + 1);
  }

  loadIpl() {
    for (let i = 0; i < ipl.length; i++) {
      this.write16(0xe000 + i * 2, ipl[i]);
    }
    this.iplMode = true;
  }

  detachIpl() {
    this.iplMode = false;
    for (let i = 0xe000; i <= 0xffff; i++) {
      this.memory.write8(i, 0);
    }
  }
}
