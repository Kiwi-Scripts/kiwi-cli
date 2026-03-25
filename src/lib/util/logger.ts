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
  debug(...data: any[]): void;
  log(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;

  shouldLog(level: LogLevel): boolean;
  
  // modifiers
  readonly ml: StringLogger;
  readonly np: Logger;
  readonly indent: (amount?: number) => Logger;
  readonly prefix: string;
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

class LoggerImpl implements Logger {
  private config: LoggerConfig;
  private modifiers: {
    indent?: number;
    ml?: boolean;
    np?: boolean;
  } = {};

  get prefix() {
    return this.config.prefix;
  }

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...defaultConfig, ...config, prefixColors: { ...defaultConfig.prefixColors, ...config?.prefixColors } };

  }

  debug(...data: any[]) {
    if (!this.shouldLog('debug')) return; // avoid unnecessary processing for debug messages
    this.handle('debug', [data
      .map(d => typeof d === 'string' ? d : inspect(d, { depth: null }))
      .join(' ')]
    );
  }

  log(...data: any[]) {
    this.handle('log', data);
  }

  warn(...data: any[]) {
    this.handle('warn', data);
  }

  error(...data: any[]) {
    this.handle('error', data);
  }

  // Modifiers
  get ml() {
    this.modifiers.ml = true;
    return this;
  }

  get np() {
    this.modifiers.np = true;
    return this;
  }

  indent(amount: number = 2): Logger {
    this.modifiers.indent = (this.modifiers.indent || 0) + amount;
    return this;
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

  private handle(level: LogLevel, data: any[]) {
    if (!this.shouldLog(level)) return;
    const [msg, args] = this.formatMessage(level, data);
    this.config.channel.write(level, msg, args);
    this.resetModifiers();
  }

  private formatMessage(level: LogLevel, data: any[]): [string, any[]] {
    const timestamp = this.getTimestamp();
    const prefix = this.getPrefix(level);
    const indent = this.modifiers.indent ? ' '.repeat(this.modifiers.indent) : '';
    if (!this.modifiers.ml) {
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

  private getPrefix(level: LogLevel) {
    if (this.modifiers.np) return '';
    return `${this.config.colorize ? this.config.prefixColors[level](this.config.prefix) : this.config.prefix} `;
  }

  private resetModifiers() {
    this.modifiers = {};
  }
}

const logger: Logger = new LoggerImpl();

function getLog(config: Partial<LoggerConfig> = {}): Logger {
  return new LoggerImpl(config);
}

function setLogLevel(level: LogLevel, loggerInstance: Logger = logger) {
  if (loggerInstance instanceof LoggerImpl) {
    loggerInstance.setLogLevel(level);
    return;
  }
  throw new Error('Cannot set log level on provided logger instance');
}

function setConfigValue<K extends keyof LoggerConfig>(key: K, value: LoggerConfig[K], loggerInstance: Logger = logger) {
  if (loggerInstance instanceof LoggerImpl) {
    loggerInstance.setConfigValue(key, value);
    return;
  }
  throw new Error('Cannot set config value on provided logger instance');
}

export default logger;
export { ConsoleChannel, getLog, NullChannel, setConfigValue, setLogLevel };
export type { LogChannel, Logger, LoggerConfig, LogLevel };

