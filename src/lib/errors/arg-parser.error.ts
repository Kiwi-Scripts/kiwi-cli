import { Command } from '@lib/commands/command.types';
import { CliError } from '@lib/errors/cli.error';
import chalk from 'chalk';

export class ArgParseError extends CliError {
  constructor(
    message: string,
    public readonly command: Command,
  ) {
    super(message);
    this.name = 'ArgParseError';
    this.suggestion = `Run 'kiwi help ${command.name}' for usage information.`;
  }

  protected formatLabel(): string {
    return `${chalk.bold(this.name)} [${this.command.name}]`;
  }
}