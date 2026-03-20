import { ownCommands } from '@lib/commands/command.registry';
import { KiwiConfig } from '@lib/config/config.types';

export interface CommandContext {
  targetCli?: string;
  command: string;
  args: string[];
  config: KiwiConfig;
}

export interface Command {
  name: string;
  description?: string;
  alias?: string;
  run(ctx: CommandContext): void | Promise<void>;
}

/** A union of all known (i.e. built-in) commands. */
export type KnownCommands = typeof ownCommands[number]['name'];