class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
    /* 下記の行はTypeScriptの出力ターゲットがES2015より古い場合(ES3, ES5)のみ必要 */
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TlbMissError extends BaseError {
  constructor() {
    super('TLB miss error');
  }
}

export class RegisterError extends BaseError {
  constructor() {
    super('Register reference error');
  }
}

export class InvalidMemoryAccessError extends BaseError {
  constructor() {
    super('Invalid memory access error');
  }
}
