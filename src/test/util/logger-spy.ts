import lazySingleton from '@lib/util/lazy-singleton';
import { LogChannel, LogLevel, setConfigValue } from '@lib/util/logger';

export interface LogEntry {
  level: LogLevel;
  msg: string;
  data: any[];
}

export interface LoggerSpy {
  /** All captured log entries in order. */
  readonly entries: LogEntry[];
  /** Entries filtered by level. */
  forLevel(level: LogLevel): LogEntry[];
  /** All message strings (first arg) for a given level. */
  messages(level: LogLevel): string[];
  /** True if any entry at the given level contains the substring. */
  includes(level: LogLevel, substring: string): boolean;
  /** Reset all captured entries. */
  clear(): void;
}

/**
 * Creates a vi.mock factory for `@lib/util/logger` that captures all log calls.
 * 
 * Usage:
 * ```ts
 * import { createLoggerSpy, loggerMockFactory } from '@test/testutil/logger-spy';
 * 
 * vi.mock('@lib/util/logger', loggerMockFactory);
 * 
 * const spy = createLoggerSpy();
 * 
 * beforeEach(() => spy.clear());
 * 
 * it('logs something', () => {
 *   // ... trigger code that logs ...
 *   expect(spy.includes('log', '[CREATE]')).toBe(true);
 * });
 * ```
 * 
 * Because `vi.mock` is hoisted, the factory must be a plain importable function.
 * `createLoggerSpy()` returns a spy that reads from the same shared buffer.
 */

const entries: LogEntry[] = [];

const spyChannel: LogChannel = {
  name: 'spy',
  write: (level, msg, data) => {
    entries.push({ level, msg, data });
  },
}

/** Returns a spy view over the shared log buffer. Call after `vi.mock`. */
function installLoggerSpy(): LoggerSpy {
  setConfigValue('channel', spyChannel);
  return {
    get entries() {
      return entries;
    },
    forLevel(level: LogLevel) {
      return entries.filter(e => e.level === level);
    },
    messages(level: LogLevel) {
      return entries.filter(e => e.level === level).map(e => String(e.msg ?? ''));
    },
    includes(level: LogLevel, substring: string) {
      return entries.some(e => e.level === level && e.msg.includes(substring));
    },
    clear() {
      entries.splice(0);
    },
  };
}

export const loggerSpy = lazySingleton.factory(installLoggerSpy);
