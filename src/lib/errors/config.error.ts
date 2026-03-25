import { CliError } from '@lib/errors/cli.error';

export class ConfigError extends CliError {
  constructor(message: string, ) {
    super(message);
    this.name = 'ConfigError';
  }
}