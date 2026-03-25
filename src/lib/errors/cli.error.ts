import logger from '@lib/util/logger';

export class CliError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = 'CliError';
  }

  public handle(): never {
    this.doHandle();
    process.exit(this.exitCode);
  }
  
  protected doHandle(): void {
    logger.error(this.message);
  }
}