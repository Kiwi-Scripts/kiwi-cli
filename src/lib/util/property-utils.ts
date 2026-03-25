/**
 * Creates a value that can be used as both a function call and a property access.
 * Property access returns the result of calling `fn` with no arguments.
 * 
 * @example
 * ```ts
 * const indent = callableAccessor(
 *   (amount: number = 2) => new Logger(amount)
 * );
 * 
 * indent.log('hi');    // property access → fn() → Logger(2) → .log('hi')
 * indent(4).log('hi'); // function call   → fn(4) → Logger(4) → .log('hi')
 * ```
 */
export function callableAccessor<TFn extends (...args: any[]) => object>(
  fn: TFn,
): ReturnType<TFn> & TFn {
  let defaultValue: ReturnType<TFn> | null = null;
  const getDefault = () => defaultValue ??= fn() as ReturnType<TFn>;

  const proxy = new Proxy(fn as unknown as ReturnType<TFn> & TFn, {
    get(target, prop) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop);
      const def = getDefault();
      return Reflect.get(def, prop, def);
    }
  });
  return proxy;
}