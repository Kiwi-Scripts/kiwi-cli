import { Command } from '@lib/commands/command.types';
import { CliError } from '@lib/errors/cli.error';
import logger from '@lib/util/logger';

export class ArgParseError extends CliError {
  constructor(
    message: string,
    public readonly command: Command,
  ) {
    super(message);
    this.name = 'ArgParseError';
  }

  protected doHandle(): void {
    logger.error(`Error parsing arguments for command '${this.command.name}': ${this.message}`);
    logger.log(`Run 'kiwi help ${this.command.name}' for usage information.`);
  }
}