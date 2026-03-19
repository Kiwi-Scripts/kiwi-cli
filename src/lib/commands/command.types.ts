import { ownCommands } from '@lib/commands/command.registry';

export interface CommandContext {
  args: string[];
}

export interface Command {
  name: string;
  description?: string;
  alias?: string;
  run(ctx: CommandContext): void | Promise<void>;
}

/** A union of all known (i.e. built-in) commands. */
export type KnownCommands = typeof ownCommands[number]['name'];