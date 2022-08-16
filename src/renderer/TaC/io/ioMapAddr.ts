/**
 * I/O空間のアドレスの定数定義
 *
 * 命名規則
 * <機器名>_<IN命令のときの意味>_<OUT命令のときの意味>
 *
 * IN命令, OUT命令のどちらかにしか意味が無い場合は00と書く
 * 両方意味が同じの場合は後者を省略する
 *
 * (MicroSDのセクタアドレス、MMUのTLBは例外として上位なのか下位なのかを表す)
 */

export const TIMER0_COUNTER_CYCLE = 0x00;
export const TIMER0_FLAG_CTRL = 0x02;
export const TIMER1_COUNTER_CYCLE = 0x04;
export const TIMER1_FLAG_CTRL = 0x06;
export const FT232RL_RECEIVE_SERVE = 0x08;
export const FT232RL_STAT_CTRL = 0x0a;
export const TECSERIAL_RECEIVE_SERVE = 0x0c;
export const TECSERIAL_STAT_CTRL = 0x0e;
export const MICROSD_STAT_CTRL = 0x10;
export const MICROSD_MEMADDR = 0x12;
export const MICROSD_SECTOR_HIGH = 0x14;
export const MICROSD_SECTOR_LOW = 0x16;
export const PIO_IN_OUT = 0x18;
export const PIO_00_ADC = 0x1a;
export const PIO_00_OUTEX = 0x1c;
export const PIO_MODE_00 = 0x1e;
export const SPI_SHIFT = 0x20;
export const SPI_STAT_FREQ = 0x22;
export const IOINTR_00_MASK = 0x24;
export const IOINTR_00_XOR = 0x26;
export const RN4020_RECEIVE_SERVE = 0x28;
export const RN4020_STAT_CTRL = 0x2a;
export const RN4020_00_CMD = 0x2c;
export const RN4020_CONNECTION = 0x2e;
export const TEC_DATALAMP_00 = 0x30;
export const TEC_00_DATASW = 0x32;
export const TEC_00_FUNCSW = 0x34;
export const TEC_STAT_CTRL = 0x36;

export const MMU_TLB0_HIGH = 0x80;
export const MMU_TLB0_LOW = 0x82;
export const MMU_TLB1_HIGH = 0x84;
export const MMU_TLB1_LOW = 0x86;
export const MMU_TLB2_HIGH = 0x88;
export const MMU_TLB2_LOW = 0x8a;
export const MMU_TLB3_HIGH = 0x8c;
export const MMU_TLB3_LOW = 0x8e;
export const MMU_TLB4_HIGH = 0x90;
export const MMU_TLB4_LOW = 0x92;
export const MMU_TLB5_HIGH = 0x94;
export const MMU_TLB5_LOW = 0x96;
export const MMU_TLB6_HIGH = 0x98;
export const MMU_TLB6_LOW = 0x9a;
export const MMU_TLB7_HIGH = 0x9c;
export const MMU_TLB7_LOW = 0x9e;
export const MMU_00_IPLBANK = 0xa0;
export const MMU_ERRORADDR_MMUON = 0xa2;
export const MMU_ERRORCAUSE_00 = 0xa4;
export const MMU_PAGE = 0xa6;

export const CONSOLE_DATASW_DATAREG = 0xf8;
export const CONSOLE_ADDRREG_00 = 0xfa;
export const CONSOLE_ROTSW_00 = 0xfc;
export const CONSOLE_FUNCREG_00 = 0xfe;
