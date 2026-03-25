import { CliError } from '@lib/errors/cli.error';

export class OptionalImportError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = 'OptionalImportError';
  }
}