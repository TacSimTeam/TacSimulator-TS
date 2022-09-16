import { IIOHostController, IIOTimer, IIOSerial, IIOConsole, IIOSdHostController, IIOMmu } from '../interface';
import * as io from './ioMapAddr';

export class IOHostController implements IIOHostController {
  private timer0: IIOTimer;
  private timer1: IIOTimer;
  private ft232rl: IIOSerial;
  private sd: IIOSdHostController;
  private mmu: IIOMmu;
  private console: IIOConsole;

  constructor(
    timer0: IIOTimer,
    timer1: IIOTimer,
    ft232rl: IIOSerial,
    sd: IIOSdHostController,
    mmu: IIOMmu,
    console: IIOConsole
  ) {
    this.timer0 = timer0;
    this.timer1 = timer1;
    this.ft232rl = ft232rl;
    this.sd = sd;
    this.mmu = mmu;
    this.console = console;
  }

  input(addr: number): number {
    let val = 0;
    // console.log(`MEMORY <- IO[0x${addr.toString(16)}]`);

    switch (addr) {
      case io.TIMER0_COUNTER_CYCLE:
        return this.timer0.getCounter();
      case io.TIMER0_FLAG_CTRL:
        if (this.timer0.getMatchFlag()) {
          val |= 0x8000;
        }
        return val;
      case io.TIMER1_COUNTER_CYCLE:
        return this.timer1.getCounter();
      case io.TIMER1_FLAG_CTRL:
        if (this.timer1.getMatchFlag()) {
          val |= 0x8000;
        }
        return val;
      case io.FT232RL_RECEIVE_SERVE:
        console.log(`MEMORY <- IO[0x${addr.toString(16)}](0x${this.ft232rl.receive().toString(16)})`);
        return this.ft232rl.receive();
      case io.FT232RL_STAT_CTRL:
        if (this.ft232rl.getWriteableFlag()) {
          val |= 0x0080;
        }
        if (this.ft232rl.getReadableFlag()) {
          val |= 0x0040;
        }
        return val;
      case io.MICROSD_STAT_CTRL:
        if (this.sd.isIdle()) {
          val |= 0x0080;
        }
        if (this.sd.isOccurredError()) {
          val |= 0x0040;
        }
        if (!window.electronAPI.isSDImageLoaded()) {
          /* SDカードが挿入されていないことを通知する */
          val |= 0x0001;
        }
        return val;
      case io.MICROSD_MEMADDR:
        return this.sd.getMemAddr();
      case io.MICROSD_SECTOR_HIGH:
        return this.sd.getSectorAddrHigh();
      case io.MICROSD_SECTOR_LOW:
        return this.sd.getSectorAddrLow();
      case io.PIO_MODE_00:
        /* 本当はジャンパから取得するが強制的にTaCモードで実行する */
        return 0x01;
      case io.MMU_TLB0_HIGH:
        return this.mmu.getTlbHigh8(0);
      case io.MMU_TLB0_LOW:
        return this.mmu.getTlbLow16(0);
      case io.MMU_TLB1_HIGH:
        return this.mmu.getTlbHigh8(1);
      case io.MMU_TLB1_LOW:
        return this.mmu.getTlbLow16(1);
      case io.MMU_TLB2_HIGH:
        return this.mmu.getTlbHigh8(2);
      case io.MMU_TLB2_LOW:
        return this.mmu.getTlbLow16(2);
      case io.MMU_TLB3_HIGH:
        return this.mmu.getTlbHigh8(3);
      case io.MMU_TLB3_LOW:
        return this.mmu.getTlbLow16(3);
      case io.MMU_TLB4_HIGH:
        return this.mmu.getTlbHigh8(4);
      case io.MMU_TLB4_LOW:
        return this.mmu.getTlbLow16(4);
      case io.MMU_TLB5_HIGH:
        return this.mmu.getTlbHigh8(5);
      case io.MMU_TLB5_LOW:
        return this.mmu.getTlbLow16(5);
      case io.MMU_TLB6_HIGH:
        return this.mmu.getTlbHigh8(6);
      case io.MMU_TLB6_LOW:
        return this.mmu.getTlbLow16(6);
      case io.MMU_TLB7_HIGH:
        return this.mmu.getTlbHigh8(7);
      case io.MMU_TLB7_LOW:
        return this.mmu.getTlbLow16(7);
      case io.MMU_ERRORADDR_MMUON:
        return this.mmu.getErrorAddr();
      case io.MMU_ERRORCAUSE_00:
        return this.mmu.getErrorCause();
      case io.MMU_PAGE_00:
        return this.mmu.getTlbMissPage();
      case io.CONSOLE_DATASW_DATAREG:
        return this.console.getDataSwitchValue();
      case io.CONSOLE_ADDRREG_00:
        return this.console.getMemAddrLEDValue();
      case io.CONSOLE_ROTSW_00:
        return this.console.getRotSwitchValue();
      case io.CONSOLE_FUNCREG_00:
        return this.console.getFuncSwitchValue();
      default:
        return 0;
    }
  }

  output(addr: number, val: number): void {
    // console.log(`IO[0x${addr.toString(16)}] <- 0x${val.toString(16)}`);
    switch (addr) {
      case io.TIMER0_COUNTER_CYCLE:
        this.timer0.setCycle(val);
        break;
      case io.TIMER0_FLAG_CTRL:
        this.timer0.setInterruptFlag(!!(val & 0x8000));
        if ((val & 0x0001) != 0) {
          this.timer0.start();
        } else {
          this.timer0.stop();
        }
        break;
      case io.TIMER1_COUNTER_CYCLE:
        this.timer1.setCycle(val);
        break;
      case io.TIMER1_FLAG_CTRL:
        this.timer1.setInterruptFlag(!!(val & 0x8000));
        if ((val & 0x0001) != 0) {
          this.timer1.start();
        } else {
          this.timer1.stop();
        }
        break;
      case io.FT232RL_RECEIVE_SERVE:
        this.ft232rl.send(val);
        break;
      case io.FT232RL_STAT_CTRL:
        this.ft232rl.setSendableIntrFlag(!!(val & 0x0080));
        this.ft232rl.setReceivableIntrFlag(!!(val & 0x0040));
        break;
      case io.MICROSD_STAT_CTRL:
        this.sd.setInterruptFlag(!!(val & 0x80));
        if ((val & 0x04) != 0) {
          this.sd.init();
        }
        if ((val & 0x02) != 0) {
          this.sd.startReading();
        }
        if ((val & 0x01) != 0) {
          this.sd.startWriting();
        }
        break;
      case io.MICROSD_MEMADDR:
        this.sd.setMemAddr(val);
        break;
      case io.MICROSD_SECTOR_HIGH:
        this.sd.setSectorAddrHigh(val);
        break;
      case io.MICROSD_SECTOR_LOW:
        this.sd.setSectorAddrLow(val);
        break;
      case io.MMU_TLB0_HIGH:
        this.mmu.setTlbHigh8(0, val);
        break;
      case io.MMU_TLB0_LOW:
        this.mmu.setTlbLow16(0, val);
        break;
      case io.MMU_TLB1_HIGH:
        this.mmu.setTlbHigh8(1, val);
        break;
      case io.MMU_TLB1_LOW:
        this.mmu.setTlbLow16(1, val);
        break;
      case io.MMU_TLB2_HIGH:
        this.mmu.setTlbHigh8(2, val);
        break;
      case io.MMU_TLB2_LOW:
        this.mmu.setTlbLow16(2, val);
        break;
      case io.MMU_TLB3_HIGH:
        this.mmu.setTlbHigh8(3, val);
        break;
      case io.MMU_TLB3_LOW:
        this.mmu.setTlbLow16(3, val);
        break;
      case io.MMU_TLB4_HIGH:
        this.mmu.setTlbHigh8(4, val);
        break;
      case io.MMU_TLB4_LOW:
        this.mmu.setTlbLow16(4, val);
        break;
      case io.MMU_TLB5_HIGH:
        this.mmu.setTlbHigh8(5, val);
        break;
      case io.MMU_TLB5_LOW:
        this.mmu.setTlbLow16(5, val);
        break;
      case io.MMU_TLB6_HIGH:
        this.mmu.setTlbHigh8(6, val);
        break;
      case io.MMU_TLB6_LOW:
        this.mmu.setTlbLow16(6, val);
        break;
      case io.MMU_TLB7_HIGH:
        this.mmu.setTlbHigh8(7, val);
        break;
      case io.MMU_TLB7_LOW:
        this.mmu.setTlbLow16(7, val);
        break;
      case io.MMU_00_IPLBANK:
        if ((val & 0x0001) != 0) {
          this.mmu.detachIpl();
        }
        break;
      case io.MMU_ERRORADDR_MMUON:
        if ((val & 0x0001) != 0) {
          this.mmu.enable();
        }
        break;
      case io.CONSOLE_DATASW_DATAREG:
        this.console.setLEDValue(val);
        break;
      default:
        break;
    }
  }
}
