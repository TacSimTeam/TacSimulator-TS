class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;

    // 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * TLBミスが発生したときに投げる例外
 * MMUを介してメモリアクセスする機器(CPUが該当する)は
 * 適切に処理する必要がある
 */
export class TlbMissError extends BaseError {
  constructor() {
    super('TLB miss error');
  }
}

/**
 * ROMになっているメモリを書き替えようとしたときに投げる例外
 */
export class ReadonlyError extends BaseError {
  constructor() {
    super('Read-only memory error');
  }
}
