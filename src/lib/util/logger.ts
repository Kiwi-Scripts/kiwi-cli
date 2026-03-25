import { callableAccessor } from '@lib/util/property-utils';
import chalk, { ChalkInstance } from 'chalk';
import { inspect } from 'node:util';

type LogLevel = keyof typeof logLevelPriority;
const logLevelPriority = {
  debug: 10,
  log: 20,
  warn: 30,
  error: 40
} as const;

interface Logger {
  readonly prefix: string;
  debug(...data: any[]): void;
  log(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;

  shouldLog(level: LogLevel): boolean;
  
  // modifiers
  readonly ml: StringLogger;
  readonly np: Logger;
  readonly indent: {
    (amount?: number): Logger;
  } & Logger;
}

interface StringLogger extends Logger {
  debug(...data: string[]): void;
  log(...data: string[]): void;
  warn(...data: string[]): void;
  error(...data: string[]): void;
}

interface LoggerConfig {
  prefix: string;
  level: LogLevel;
  channel: LogChannel;
  colorize: boolean;
  prefixColors: Record<LogLevel, ChalkInstance>;
  showTimestamp: boolean;
}

interface LogChannel {
  name: string;
  write(level: LogLevel, msg: string, data: any[]): void;
}

const ConsoleChannel: LogChannel = {
  name: 'console',
  write(level, msg, data) {
    if (level === 'error') {
      console.error(msg, ...data);
    } else {
      console.log(msg, ...data);
    }
  }
}
const NullChannel: LogChannel = {
  name: 'null',
  write() {
    // do nothing
  }
};

const defaultConfig: LoggerConfig = {
  prefix: '[kiwi]',
  level: 'log',
  channel: ConsoleChannel,
  colorize: true,
  prefixColors: {
    debug: chalk.gray,
    log: chalk.magenta,
    warn: chalk.yellow,
    error: chalk.red
  },
  showTimestamp: false
}

interface LoggerModifiers {
  indent?: number;
  ml?: boolean;
  np?: boolean;
}

class LoggerInstance implements Logger {
  constructor(
    private readonly owner: LoggerImpl,
    private readonly modifiers: LoggerModifiers = {}
  ) {}

  // Chaining — returns new LogEntry with merged modifiers (immutable)
  get ml()  { return new LoggerInstance(this.owner, { ...this.modifiers, ml: true }); }
  get np()  { return new LoggerInstance(this.owner, { ...this.modifiers, np: true }); }
  get indent() { return callableAccessor((amount: number = 2) => new LoggerInstance(this.owner, { ...this.modifiers, indent: (this.modifiers.indent ?? 0) + amount })); }

  // Terminal methods — fire and forget, no state to reset
  debug(...data: any[]) { this.owner.debug(data, this.modifiers); }
  log(...data: any[])   { this.owner.writeWithModifiers('log', data, this.modifiers); }
  warn(...data: any[])  { this.owner.writeWithModifiers('warn', data, this.modifiers); }
  error(...data: any[]) { this.owner.writeWithModifiers('error', data, this.modifiers); }

  // Forward read-only members
  shouldLog(level: LogLevel) { return this.owner.shouldLog(level); }
  get prefix() { return this.owner.prefix; }

  setLogLevel(level: LogLevel) { this.owner.setLogLevel(level); }
  setConfigValue<K extends keyof LoggerConfig>(key: K, value: LoggerConfig[K]) { this.owner.setConfigValue(key, value); }
}

class LoggerImpl {
  private config: LoggerConfig;

  get prefix() {
    return this.config.prefix;
  }

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...defaultConfig, ...config, prefixColors: { ...defaultConfig.prefixColors, ...config?.prefixColors } };

  }

  debug(data: any[], modifiers: LoggerModifiers = {}) {
    if (!this.shouldLog('debug')) return; // avoid unnecessary processing for debug messages
    this.writeWithModifiers('debug', [data
      .map(d => typeof d === 'string' ? d : inspect(d, { depth: null }))
      .join(' ')]
    , modifiers);
  }

  setLogLevel(level: LogLevel) {
    if (!logLevelPriority[level]) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.config.level = level;
  }

  setConfigValue<K extends keyof LoggerConfig>(key: K, value: LoggerConfig[K]) {
    if (key === 'prefixColors') {
      this.config.prefixColors = { ...this.config.prefixColors, ...(value as Partial<LoggerConfig['prefixColors']>) };
      return;
    }
    this.config[key] = value;
  }

  shouldLog(level: LogLevel): boolean {
    return logLevelPriority[level] >= logLevelPriority[this.config.level];
  }

  public writeWithModifiers(level: LogLevel, data: any[], modifiers: LoggerModifiers) {
    if (!this.shouldLog(level)) return;
    const [msg, args] = this.formatMessage(level, data, modifiers);
    this.config.channel.write(level, msg, args);
  }

  private formatMessage(level: LogLevel, data: any[], modifiers: LoggerModifiers): [string, any[]] {
    const timestamp = this.getTimestamp();
    const prefix = this.getPrefix(level, modifiers);
    const indent = modifiers.indent ? ' '.repeat(modifiers.indent) : '';
    if (!modifiers.ml) {
      const msg = typeof data[0] === 'string' ? data[0] : '';
      const assembledMsg = `${timestamp}${prefix}${indent}${msg}`.trim();
      return [this.colorizeMsg(level, assembledMsg), data.slice(1)];
    }
    const mlData = data.flatMap(d => d.split('\n')).map(d => `${timestamp}${prefix}${indent}${d}`).join('\n');
    return [this.colorizeMsg(level, mlData), []];
  }

  private colorizeMsg(level: LogLevel, msg: string): string {
    if (!this.config.colorize || level === 'log') return msg;
    const colorFn = this.config.prefixColors[level] || ((s: string) => s);
    return colorFn(msg);
  }

  private getTimestamp(): string {
    if (!this.config.showTimestamp) return '';
    const timestamp = `(${new Date().toISOString()}) `;
    return this.config.colorize ? chalk.gray(timestamp) : timestamp;
  }

  private getPrefix(level: LogLevel, modifiers: LoggerModifiers) {
    if (modifiers.np) return '';
    return `${this.config.colorize ? this.config.prefixColors[level](this.config.prefix) : this.config.prefix} `;
  }
}

const logger: Logger = new LoggerInstance(new LoggerImpl());

function getLog(config: Partial<LoggerConfig> = {}): Logger {
  return new LoggerInstance(new LoggerImpl(config));
}

function setLogLevel(level: LogLevel, loggerInstance: Logger = logger) {
  if (loggerInstance instanceof LoggerInstance) {
    (loggerInstance as LoggerInstance).setLogLevel(level);
    return;
  }
  throw new Error('Cannot set log level on provided logger instance');
}

function setConfigValue<K extends keyof LoggerConfig>(key: K, value: LoggerConfig[K], loggerInstance: Logger = logger) {
  if (loggerInstance instanceof LoggerInstance) {
    (loggerInstance as LoggerInstance).setConfigValue(key, value);
    return;
  }
  throw new Error('Cannot set config value on provided logger instance');
}

export default logger;
export { ConsoleChannel, getLog, NullChannel, setConfigValue, setLogLevel };
export type { LogChannel, Logger, LoggerConfig, LogLevel };

