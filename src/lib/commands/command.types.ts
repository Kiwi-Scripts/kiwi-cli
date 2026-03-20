import { KiwiConfigInternal } from '@lib/config/config.types';

export interface CommandContext {
  targetCli?: string;
  command: string;
  args: string[];
  config: KiwiConfigInternal;
}

export interface Command {
  name: string;
  description?: string;
  alias?: string;
  run(ctx: CommandContext): void | Promise<void>;
}
