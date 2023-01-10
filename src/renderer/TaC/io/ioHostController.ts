import {
  IIOHostController,
  IIOTimer,
  IIOSerial,
  IIOConsole,
  IIOSdHostController,
  IIOMmu,
} from '../interface';
import * as io from './ioMapAddr';

export class IOHostController implements IIOHostController {
  private timer0: IIOTimer;
  private timer1: IIOTimer;
  private ft232rl: IIOSerial;
  private rn4020: IIOSerial;
  private sd: IIOSdHostController;
  private mmu: IIOMmu;
  private console: IIOConsole;

  constructor(
    timer0: IIOTimer,
    timer1: IIOTimer,
    ft232rl: IIOSerial,
    rn4020: IIOSerial,
    sd: IIOSdHostController,
    mmu: IIOMmu,
    console: IIOConsole
  ) {
    this.timer0 = timer0;
    this.timer1 = timer1;
    this.ft232rl = ft232rl;
    this.rn4020 = rn4020;
    this.sd = sd;
    this.mmu = mmu;
    this.console = console;
  }

  input(addr: number): number {
    let val = 0;

    switch (addr) {
      case io.TIMER0_COUNTER_CYCLE:
        return this.timer0.getCounter();
      case io.TIMER0_FLAG_CTRL:
        if (this.timer0.isMatched()) {
          val |= 0x8000;
        }
        return val;
      case io.TIMER1_COUNTER_CYCLE:
        return this.timer1.getCounter();
      case io.TIMER1_FLAG_CTRL:
        if (this.timer1.isMatched()) {
          val |= 0x8000;
        }
        return val;
      case io.FT232RL_RECEIVE_SERVE:
        return this.ft232rl.receive();
      case io.FT232RL_STAT_CTRL:
        if (this.ft232rl.isWriteable()) {
          val |= 0x0080;
        }
        if (this.ft232rl.isReadable()) {
          val |= 0x0040;
        }
        return val;
      case io.MICROSD_STAT_CTRL:
        if (this.sd.isIdle()) {
          val |= 0x0080;
        }
        if (this.sd.isErrorOccurred()) {
          val |= 0x0040;
        }
        if (!window.electronAPI.isSDImgLoaded()) {
          // SDカードが挿入されていなければLSBを1にして返す
          val |= 0x0001;
        }
        return val;
      case io.MICROSD_MEMADDR:
        return this.sd.getMemAddr();
      case io.MICROSD_SECTORHIGH:
        return this.sd.getSecAddrH();
      case io.MICROSD_SECTORLOW:
        return this.sd.getSecAddrL();
      case io.PIO_MODE_00:
        // 本当はジャンパから取得するが強制的にTaCモードで実行する
        return 0x01;
      case io.RN4020_RECEIVE_SERVE:
        return this.rn4020.receive();
      case io.RN4020_STAT_CTRL:
        if (this.rn4020.isWriteable()) {
          val |= 0x0080;
        }
        if (this.rn4020.isReadable()) {
          val |= 0x0040;
        }
        return val;
      case io.RN4020_00_COMMAND:
        return 0x00;
      case io.RN4020_CONNECTION:
        return 0x01;
      case io.MMU_TLB0HIGH:
        return this.mmu.getTlbHigh8(0);
      case io.MMU_TLB0LOW:
        return this.mmu.getTlbLow16(0);
      case io.MMU_TLB1HIGH:
        return this.mmu.getTlbHigh8(1);
      case io.MMU_TLB1LOW:
        return this.mmu.getTlbLow16(1);
      case io.MMU_TLB2HIGH:
        return this.mmu.getTlbHigh8(2);
      case io.MMU_TLB2LOW:
        return this.mmu.getTlbLow16(2);
      case io.MMU_TLB3HIGH:
        return this.mmu.getTlbHigh8(3);
      case io.MMU_TLB3LOW:
        return this.mmu.getTlbLow16(3);
      case io.MMU_TLB4HIGH:
        return this.mmu.getTlbHigh8(4);
      case io.MMU_TLB4LOW:
        return this.mmu.getTlbLow16(4);
      case io.MMU_TLB5HIGH:
        return this.mmu.getTlbHigh8(5);
      case io.MMU_TLB5LOW:
        return this.mmu.getTlbLow16(5);
      case io.MMU_TLB6HIGH:
        return this.mmu.getTlbHigh8(6);
      case io.MMU_TLB6LOW:
        return this.mmu.getTlbLow16(6);
      case io.MMU_TLB7HIGH:
        return this.mmu.getTlbHigh8(7);
      case io.MMU_TLB7LOW:
        return this.mmu.getTlbLow16(7);
      case io.MMU_TLB8HIGH:
        return this.mmu.getTlbHigh8(8);
      case io.MMU_TLB8LOW:
        return this.mmu.getTlbLow16(8);
      case io.MMU_TLB9HIGH:
        return this.mmu.getTlbHigh8(9);
      case io.MMU_TLB9LOW:
        return this.mmu.getTlbLow16(9);
      case io.MMU_TLB10HIGH:
        return this.mmu.getTlbHigh8(10);
      case io.MMU_TLB10LOW:
        return this.mmu.getTlbLow16(10);
      case io.MMU_TLB11HIGH:
        return this.mmu.getTlbHigh8(11);
      case io.MMU_TLB11LOW:
        return this.mmu.getTlbLow16(11);
      case io.MMU_TLB12HIGH:
        return this.mmu.getTlbHigh8(12);
      case io.MMU_TLB12LOW:
        return this.mmu.getTlbLow16(12);
      case io.MMU_TLB13HIGH:
        return this.mmu.getTlbHigh8(13);
      case io.MMU_TLB13LOW:
        return this.mmu.getTlbLow16(13);
      case io.MMU_TLB14HIGH:
        return this.mmu.getTlbHigh8(14);
      case io.MMU_TLB14LOW:
        return this.mmu.getTlbLow16(14);
      case io.MMU_TLB15HIGH:
        return this.mmu.getTlbHigh8(15);
      case io.MMU_TLB15LOW:
        return this.mmu.getTlbLow16(15);
      case io.MMU_ERRORADDR_MMUON:
        return this.mmu.getErrorAddr();
      case io.MMU_ERRORCAUSE_00:
        return this.mmu.getErrorCause();
      case io.MMU_PAGE_00:
        return this.mmu.getErrorPage();
      case io.CONSOLE_DATASW_DATAREG:
        return this.console.getDataSwitch();
      case io.CONSOLE_ADDRREG_00:
        return this.console.getMemAddr();
      case io.CONSOLE_ROTSW_00:
        return this.console.getRotSwitch();
      case io.CONSOLE_FUNCREG_00:
        return this.console.getFuncSwitch();
      default:
        // 対応していないアドレスの場合は0を返す
        return 0;
    }
  }

  output(addr: number, val: number): void {
    switch (addr) {
      case io.TIMER0_COUNTER_CYCLE:
        this.timer0.setCycle(val);
        break;
      case io.TIMER0_FLAG_CTRL:
        this.timer0.setIntrFlag((val & 0x8000) !== 0);
        if ((val & 0x0001) !== 0) {
          this.timer0.start();
        } else {
          this.timer0.stop();
        }
        break;
      case io.TIMER1_COUNTER_CYCLE:
        this.timer1.setCycle(val);
        break;
      case io.TIMER1_FLAG_CTRL:
        this.timer1.setIntrFlag((val & 0x8000) !== 0);
        if ((val & 0x0001) !== 0) {
          this.timer1.start();
        } else {
          this.timer1.stop();
        }
        break;
      case io.FT232RL_RECEIVE_SERVE:
        this.ft232rl.send(val);
        break;
      case io.FT232RL_STAT_CTRL:
        this.ft232rl.setSendableIntrFlag((val & 0x0080) !== 0);
        this.ft232rl.setReceivableIntrFlag((val & 0x0040) !== 0);
        break;
      case io.MICROSD_STAT_CTRL:
        this.sd.setIntrFlag((val & 0x80) !== 0);
        if ((val & 0x04) !== 0) {
          this.sd.init();
        }
        if ((val & 0x02) !== 0) {
          this.sd.startReading();
        }
        if ((val & 0x01) !== 0) {
          this.sd.startWriting();
        }
        break;
      case io.MICROSD_MEMADDR:
        this.sd.setMemAddr(val);
        break;
      case io.MICROSD_SECTORHIGH:
        this.sd.setSecAddrH(val);
        break;
      case io.MICROSD_SECTORLOW:
        this.sd.setSecAddrL(val);
        break;
      case io.RN4020_RECEIVE_SERVE:
        this.rn4020.send(val);
        break;
      case io.RN4020_STAT_CTRL:
        this.rn4020.setSendableIntrFlag((val & 0x0080) !== 0);
        this.rn4020.setReceivableIntrFlag((val & 0x0040) !== 0);
        break;
      case io.RN4020_00_COMMAND:
        break;
      case io.RN4020_CONNECTION:
        break;
      case io.MMU_TLB0HIGH:
        this.mmu.setTlbHigh8(0, val);
        break;
      case io.MMU_TLB0LOW:
        this.mmu.setTlbLow16(0, val);
        break;
      case io.MMU_TLB1HIGH:
        this.mmu.setTlbHigh8(1, val);
        break;
      case io.MMU_TLB1LOW:
        this.mmu.setTlbLow16(1, val);
        break;
      case io.MMU_TLB2HIGH:
        this.mmu.setTlbHigh8(2, val);
        break;
      case io.MMU_TLB2LOW:
        this.mmu.setTlbLow16(2, val);
        break;
      case io.MMU_TLB3HIGH:
        this.mmu.setTlbHigh8(3, val);
        break;
      case io.MMU_TLB3LOW:
        this.mmu.setTlbLow16(3, val);
        break;
      case io.MMU_TLB4HIGH:
        this.mmu.setTlbHigh8(4, val);
        break;
      case io.MMU_TLB4LOW:
        this.mmu.setTlbLow16(4, val);
        break;
      case io.MMU_TLB5HIGH:
        this.mmu.setTlbHigh8(5, val);
        break;
      case io.MMU_TLB5LOW:
        this.mmu.setTlbLow16(5, val);
        break;
      case io.MMU_TLB6HIGH:
        this.mmu.setTlbHigh8(6, val);
        break;
      case io.MMU_TLB6LOW:
        this.mmu.setTlbLow16(6, val);
        break;
      case io.MMU_TLB7HIGH:
        this.mmu.setTlbHigh8(7, val);
        break;
      case io.MMU_TLB7LOW:
        this.mmu.setTlbLow16(7, val);
        break;
      case io.MMU_TLB8HIGH:
        this.mmu.setTlbHigh8(8, val);
        break;
      case io.MMU_TLB8LOW:
        this.mmu.setTlbLow16(8, val);
        break;
      case io.MMU_TLB9HIGH:
        this.mmu.setTlbHigh8(9, val);
        break;
      case io.MMU_TLB9LOW:
        this.mmu.setTlbLow16(9, val);
        break;
      case io.MMU_TLB10HIGH:
        this.mmu.setTlbHigh8(10, val);
        break;
      case io.MMU_TLB10LOW:
        this.mmu.setTlbLow16(10, val);
        break;
      case io.MMU_TLB11HIGH:
        this.mmu.setTlbHigh8(11, val);
        break;
      case io.MMU_TLB11LOW:
        this.mmu.setTlbLow16(11, val);
        break;
      case io.MMU_TLB12HIGH:
        this.mmu.setTlbHigh8(12, val);
        break;
      case io.MMU_TLB12LOW:
        this.mmu.setTlbLow16(12, val);
        break;
      case io.MMU_TLB13HIGH:
        this.mmu.setTlbHigh8(13, val);
        break;
      case io.MMU_TLB13LOW:
        this.mmu.setTlbLow16(13, val);
        break;
      case io.MMU_TLB14HIGH:
        this.mmu.setTlbHigh8(14, val);
        break;
      case io.MMU_TLB14LOW:
        this.mmu.setTlbLow16(14, val);
        break;
      case io.MMU_TLB15HIGH:
        this.mmu.setTlbHigh8(15, val);
        break;
      case io.MMU_TLB15LOW:
        this.mmu.setTlbLow16(15, val);
        break;
      case io.MMU_00_IPLBANK:
        if ((val & 0x0001) !== 0) {
          this.mmu.detachIpl();
        }
        break;
      case io.MMU_ERRORADDR_MMUON:
        if ((val & 0x0001) !== 0) {
          this.mmu.enable();
        }
        break;
      case io.CONSOLE_DATASW_DATAREG:
        this.console.setLEDLamps(val);
        break;
    }
  }
}
