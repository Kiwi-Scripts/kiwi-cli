import logger from '@lib/util/logger';
import chalk from 'chalk';

export class CliError extends Error {
  public suggestion?: string;

  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = 'CliError';
  }

  public handle(): never {
    this.doHandle();
    process.exit(this.exitCode);
  }

  protected doHandle(): void {
    logger.np.log();
    logger.error(`${this.formatLabel()}: ${this.message}`);
    if (this.suggestion) {
      logger.indent.error(`${chalk.dim('Hint:')} ${this.suggestion}`);
    }
    if (logger.shouldLog('debug') && this.stack) {
      logger.np.log();
      logger.error(chalk.dim(this.stack));
    }
    logger.np.log();
  }

  protected formatLabel(): string {
    return chalk.bold(this.name);
  }
}