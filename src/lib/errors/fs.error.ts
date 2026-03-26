import { CliError } from '@lib/errors/cli.error';

export class FileSystemError extends CliError {
  constructor(message: string, public readonly path: string, exitCode: number = 1) {
    super(message, exitCode);
    this.name = 'FileSystemError';
  }

  protected formatLabel(): string {
    return `${super.formatLabel()} (${this.path})`;
  }
}