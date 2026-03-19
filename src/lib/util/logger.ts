import chalk from 'chalk';

// TODO Bare bones logger: should be replaced down the road with a proper implementation

type LogLevel = keyof typeof logLevelPriority;
const logLevelPriority = {
  debug: 10,
  log: 20,
  warn: 30,
  error: 40
} as const;

interface Logger {
  debug(msg?: string, ...args: any[]): void;
  log(msg?: string, ...args: any[]): void;
  warn(msg?: string, ...args: any[]): void;
  error(msg?: string, ...args: any[]): void;
}

const defaultLogLevel: LogLevel = 'log';
const labels = {
  prefix: chalk.magenta('[kiwi]'),
  debug: chalk.green('Debug:'),
  warn: chalk.yellow('Warning:'),
  error: chalk.red('Error:')
}

function shouldLog(level: LogLevel) {
  return !(logLevelPriority[level] < logLevelPriority[defaultLogLevel]);
}

function debug(msg: string = '', ...args: any[]) {
  if (shouldLog('debug')) console.log([labels.prefix, labels.debug, msg].join(' '), ...args);
}

function log(msg: string = '', ...args: any[]) {
  if (shouldLog('log')) console.log(`${labels.prefix} ${msg}`, ...args);
}

function warn(msg: string = '', ...args: any[]) {
  if (shouldLog('warn')) console.log([labels.prefix, labels.warn, msg].join(' '), ...args);
}

function error(msg: string = '', ...args: any[]) {
  if (shouldLog('error')) console.log([labels.prefix, labels.error, msg].join(' '), ...args);
}

const logger: Logger = { debug, error, log, warn };
export default logger;
