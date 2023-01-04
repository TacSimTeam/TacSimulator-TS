/**
 * 結果を表現する抽象データ型
 *
 * 正常な結果を表すSuccess<T, E>か異常な結果を表すFailure<T, E>のunionである.
 * 次のメソッドを用いて型の絞り込みを行うことができる
 * - isSuccess()
 * - isFailure()
 */
export type Result<T, E> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly value: T;
  type: 'success' = 'success';

  constructor(value: T) {
    this.value = value;
  }

  isSuccess(): this is Success<T, E> {
    return true;
  }

  isFailure(): this is Failure<T, E> {
    return false;
  }

  /**
   * 値を取り出す(エラーなら例外を出す)
   *
   * @return 正常なら値
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * 値を取り出す
   *
   * @return 正常なら値, 異常なら引数に与えた値
   */
  unwrapOr(alt: T): T {
    return this.value;
  }
}

export class Failure<T, E> {
  readonly value: E;
  type: 'failure' = 'failure';

  constructor(value: E) {
    this.value = value;
  }

  isSuccess(): this is Success<T, E> {
    return false;
  }

  isFailure(): this is Failure<T, E> {
    return true;
  }

  /**
   * 値を取り出す(エラーなら例外を出す)
   *
   * @return 正常なら値
   */
  unwrap(): T {
    throw new Error('Failure');
  }

  /**
   * 値を取り出す
   *
   * @return 正常なら値, 異常なら引数に与えた値
   */
  unwrapOr(alt: T): T {
    return alt;
  }
}
