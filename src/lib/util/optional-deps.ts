import { OptionalImportError } from '@lib/errors/import.error';
import logger from '@lib/util/logger';
import { Prettify } from '@lib/util/types';

const NOT_FOUND = Symbol('NOT_FOUND');
const cache = new Map<OptionalDepName, any>();

// single manual tracking list for global dynamic typed imports
type OptionalDepTypes = {
  clipboardy: typeof import('clipboardy');
  tsx: typeof import('tsx/esm/api');
};
type OptionalDepName = keyof OptionalDepTypes | (string & {});
type ResolveOptionalDep<T extends OptionalDepName> = T extends keyof OptionalDepTypes ? OptionalDepTypes[T] : unknown;

export async function loadOptionalDep<T extends OptionalDepName>(
  packageName: T,
  messageOnFailure?: string
): Promise<Prettify<ResolveOptionalDep<T>>> {
  const cached = cache.get(packageName);
  if (cached === NOT_FOUND) {
    throw new OptionalImportError(messageOnFailure ?? `Previously failed to load optional dependency '${packageName}'.`);
  }
  if (cached !== undefined) return cached;
  
  try {
    const mod = await import(packageName as string);
    cache.set(packageName, mod);
    return mod;
  } catch (error) {
    cache.set(packageName, NOT_FOUND);
    throw new OptionalImportError(messageOnFailure ?? `Failed to load optional dependency '${packageName}'.`);
  }
}

/**
 * Lazily load an optional dependency. The module is imported on first
 * call and cached afterwards. If the import fails the failure is
 * cached too — no further attempts are made and `undefined` is returned.
 *
 * Usage:
 * ```ts
 * const clipboardy = await loadOptionalDep('clipboardy');
 * clipboardy?.default.writeSync('hello');
 * ```
 */
export async function tryLoadOptionalDep<T extends OptionalDepName>(
  packageName: T,
  messageOnFailure?: string
): Promise<Prettify<ResolveOptionalDep<T>> | undefined> {
  try {
    return await loadOptionalDep(packageName, messageOnFailure);
  } catch (error: any) {
    logger.warn(error.message);
    logger.debug('Error:', error.cause.message);
    logger.ml.debug(error.stack?.toString() ?? '');
    return undefined;
  }
}
