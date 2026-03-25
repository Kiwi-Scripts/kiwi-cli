import { CliError } from '@lib/errors/cli.error';

export class ModuleLoadingError extends CliError {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'ModuleLoadingError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}