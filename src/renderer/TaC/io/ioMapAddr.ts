/**
 * I/O空間のアドレスの定数定義
 *
 * 命名規則
 * <機器名>_<IN命令のときの意味>_<OUT命令のときの意味>
 *
 * IN命令, OUT命令のどちらかにしか意味が無い場合は00と書く
 * 両方意味が同じの場合は後者を省略する
 */

export const TIMER0_COUNTER_CYCLE = 0x00;
export const TIMER0_FLAG_CTRL = 0x02;
export const TIMER1_COUNTER_CYCLE = 0x04;
export const TIMER1_FLAG_CTRL = 0x06;

// シミュレータでは内蔵のターミナルに接続される
export const FT232RL_RECEIVE_SERVE = 0x08;
export const FT232RL_STAT_CTRL = 0x0a;

export const TECSERIAL_RECEIVE_SERVE = 0x0c;
export const TECSERIAL_STAT_CTRL = 0x0e;
export const MICROSD_STAT_CTRL = 0x10;
export const MICROSD_MEMADDR = 0x12;
export const MICROSD_SECTORHIGH = 0x14;
export const MICROSD_SECTORLOW = 0x16;
export const PIO_IN_OUT = 0x18;
export const PIO_00_ADC = 0x1a;
export const PIO_00_OUTEX = 0x1c;
export const PIO_MODE_00 = 0x1e;
export const SPI_SHIFT = 0x20;
export const SPI_STAT_SCLKFREQ = 0x22;
export const IOINTR_00_MASK = 0x24;
export const IOINTR_00_XOR = 0x26;

// シミュレータでは開発者ツールのコンソールログに接続される
export const RN4020_RECEIVE_SERVE = 0x28;
export const RN4020_STAT_CTRL = 0x2a;
export const RN4020_00_COMMAND = 0x2c;
export const RN4020_CONNECTION = 0x2e;

export const TEC_DATALAMP_00 = 0x30;
export const TEC_00_DATASW = 0x32;
export const TEC_00_FUNCSW = 0x34;
export const TEC_STAT_CTRL = 0x36;

export const MMU_TLB0HIGH = 0x60;
export const MMU_TLB0LOW = 0x62;
export const MMU_TLB1HIGH = 0x64;
export const MMU_TLB1LOW = 0x66;
export const MMU_TLB2HIGH = 0x68;
export const MMU_TLB2LOW = 0x6a;
export const MMU_TLB3HIGH = 0x6c;
export const MMU_TLB3LOW = 0x6e;
export const MMU_TLB4HIGH = 0x70;
export const MMU_TLB4LOW = 0x72;
export const MMU_TLB5HIGH = 0x74;
export const MMU_TLB5LOW = 0x76;
export const MMU_TLB6HIGH = 0x78;
export const MMU_TLB6LOW = 0x7a;
export const MMU_TLB7HIGH = 0x7c;
export const MMU_TLB7LOW = 0x7e;

export const MMU_TLB8HIGH = 0x80;
export const MMU_TLB8LOW = 0x82;
export const MMU_TLB9HIGH = 0x84;
export const MMU_TLB9LOW = 0x86;
export const MMU_TLB10HIGH = 0x88;
export const MMU_TLB10LOW = 0x8a;
export const MMU_TLB11HIGH = 0x8c;
export const MMU_TLB11LOW = 0x8e;
export const MMU_TLB12HIGH = 0x90;
export const MMU_TLB12LOW = 0x92;
export const MMU_TLB13HIGH = 0x94;
export const MMU_TLB13LOW = 0x96;
export const MMU_TLB14HIGH = 0x98;
export const MMU_TLB14LOW = 0x9a;
export const MMU_TLB15HIGH = 0x9c;
export const MMU_TLB15LOW = 0x9e;

export const MMU_00_IPLBANK = 0xa0;
export const MMU_ERRORADDR_MMUON = 0xa2;
export const MMU_ERRORCAUSE_00 = 0xa4;
export const MMU_PAGE_00 = 0xa6;

export const CONSOLE_DATASW_DATAREG = 0xf8;
export const CONSOLE_ADDRREG_00 = 0xfa;
export const CONSOLE_ROTSW_00 = 0xfc;
export const CONSOLE_FUNCREG_00 = 0xfe;
