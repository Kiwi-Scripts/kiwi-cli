type Ctor<T> = new ( ...args: any[] ) => T;

type LazySingleton = {
  <T extends object>(ctor: Ctor<T>): T;
  factory<T extends object>(factory: () => T): T;
}

function factory<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  function ensure(): T {
    return instance ??= factory();
  }
  return new Proxy<T>({} as T, {
    get(_, prop) {
      return Reflect.get(ensure(), prop, ensure());
    },
    set(_, prop, value) {
      return Reflect.set(ensure(), prop, value, ensure());
    },
    getPrototypeOf() {
        return Object.getPrototypeOf(ensure());
    },
    ownKeys() {
        return Reflect.ownKeys(ensure());
    },
    getOwnPropertyDescriptor(_, prop) {
        return Reflect.getOwnPropertyDescriptor(ensure(), prop);
    },
    has(_, prop) {
      return Reflect.has(ensure(), prop);
    },
  });
}

/**
 * Creates a lazy singleton instance of the given class or factory function. The instance is only created upon first property access or assignment.\
 * This allows the use of singletons that are expensive to create or have side effects upon importing their module, without incurring those costs until actually needed.\
 * 
 * Example usage:
 * ```ts 
 * // Using a class constructor
 * const mySingleton = lazySingleton(MyClass);
 * 
 * // Using a factory function to supply constructor args
 * const myOtherSingleton = lazySingleton.factory(() => new MyClass('factory'));
 * ```
 */
const lazySingleton: LazySingleton = Object.assign(
  function <T extends object>(ctor: Ctor<T>): T {
    return factory(() => new ctor());
  },
  { factory },
);

export default lazySingleton;
