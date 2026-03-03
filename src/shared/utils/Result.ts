/**
 * Result Type - Functional Error Handling
 * Inspired by Rust's Result<T, E> and Haskell's Either
 * 
 * Usage:
 *   const result = Result.ok(value);
 *   const error = Result.fail(new Error('message'));
 * 
 *   result
 *     .map(v => v * 2)
 *     .flatMap(v => validate(v))
 *     .fold(
 *       error => console.error(error),
 *       value => console.log(value)
 *     );
 */

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export class Result<T, E = Error> {
  private constructor(
    private readonly _isOk: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  /**
   * Create a successful Result
   */
  static ok<T>(value: T): Result<T, never> {
    return new Result<T, never>(true, value, undefined);
  }

  /**
   * Create a failed Result
   */
  static fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined, error);
  }

  /**
   * Check if Result is Ok
   */
  isOk(): boolean {
    return this._isOk;
  }

  /**
   * Check if Result is Fail
   */
  isFail(): boolean {
    return !this._isOk;
  }

  /**
   * Get the value (throws if Fail)
   */
  getValue(): T {
    if (this._isOk) {
      return this._value as T;
    }
    throw new Error('Cannot get value from a failed Result');
  }

  /**
   * Get the error (throws if Ok)
   */
  getError(): E {
    if (!this._isOk) {
      return this._error as E;
    }
    throw new Error('Cannot get error from a successful Result');
  }

  /**
   * Get value or return default
   */
  getOrElse(defaultValue: T): T {
    return this._isOk ? (this._value as T) : defaultValue;
  }

  /**
   * Get value or throw error
   */
  getOrThrow(): T {
    if (this._isOk) {
      return this._value as T;
    }
    throw this._error;
  }

  /**
   * Map over the value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  /**
   * Map over the error
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (!this._isOk) {
      return Result.fail(fn(this._error as E));
    }
    return Result.ok(this._value as T);
  }

  /**
   * Flat map (chain) operations
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isOk) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }

  /**
   * Tap into the value without transforming
   */
  tap(fn: (value: T) => void): Result<T, E> {
    if (this._isOk) {
      fn(this._value as T);
    }
    return this;
  }

  /**
   * Fold (reduce) the Result to a single value
   */
  fold<U>(onError: (error: E) => U, onSuccess: (value: T) => U): U {
    if (this._isOk) {
      return onSuccess(this._value as T);
    }
    return onError(this._error as E);
  }

  /**
   * Match with side effects
   */
  match(onError: (error: E) => void, onSuccess: (value: T) => void): void {
    if (this._isOk) {
      onSuccess(this._value as T);
    } else {
      onError(this._error as E);
    }
  }

  /**
   * Convert to Promise
   */
  toPromise(): Promise<T> {
    if (this._isOk) {
      return Promise.resolve(this._value as T);
    }
    return Promise.reject(this._error);
  }

  /**
   * Create from a throwing function
   */
  static fromThrowable<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Combine multiple Results
   * Returns Ok only if all Results are Ok
   */
  static combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isFail()) {
        return Result.fail(result.getError());
      }
      values.push(result.getValue());
    }
    return Result.ok(values);
  }

  /**
   * Combine multiple Results with all errors
   */
  static combineAll<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
    const values: T[] = [];
    const errors: E[] = [];
    
    for (const result of results) {
      if (result.isOk()) {
        values.push(result.getValue());
      } else {
        errors.push(result.getError());
      }
    }
    
    if (errors.length > 0) {
      return Result.fail(errors);
    }
    return Result.ok(values);
  }
}

/**
 * Helper type for async results
 */
export type ResultAsync<T, E = Error> = Promise<Result<T, E>>;

/**
 * Helper function to wrap async operations
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return Result.ok(value);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)));
  }
}
