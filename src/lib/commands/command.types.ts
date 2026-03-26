import { KiwiConfigInternal } from '@lib/config/config.types';
import { ArgType, InferParsed } from '@lib/util/types';

// === Definitions ==============================================

export interface PositionalArgDef {
  readonly name: string;
  readonly type: ArgType;
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string | number | boolean;
}

export interface OptionDef {
  readonly name: string;
  readonly type: ArgType;
  readonly aliases?: string[];
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string | number | boolean;
  /** Allows the use of the command while ignoring required positionals. */
  readonly standalone?: boolean;
}

// === Context ==================================================

export interface CommandContext<
  TArgs extends readonly PositionalArgDef[] = [],
  TOpts extends readonly OptionDef[] = [],
> {
  targetCli?: string;
  command: string;
  rawArgs: string[];
  positionalArgs: InferParsed<TArgs>;
  options: InferParsed<TOpts>;
  config: KiwiConfigInternal;
}

// === Command Definition (generic, used at definition site) ====

interface AdvancedConfigs {
  /** If false, allows passing more positional arguments than defined and unknown options without throwing an error. */
  strict?: boolean;
}

export interface CommandDef<
  TArgs extends readonly PositionalArgDef[] = [],
  TOpts extends readonly OptionDef[] = [],
> {
  name: string;
  description?: string;
  alias?: string;
  positionalArgs?: TArgs;
  options?: TOpts;
  advancedConfig?: AdvancedConfigs;
  run(ctx: CommandContext<TArgs, TOpts>): void | Promise<void>;
}

// === Command (type-erased, used by the registry) =============

export type Command = Readonly<CommandDef<PositionalArgDef[], OptionDef[]>>;

// === defineCommand Helper ====================================

/**
 * Define a typed command. The handler receives fully typed
 * `ctx.args` and `ctx.options` inferred from the definition.
 *
 * Returns a registry-compatible `Command`.
 */
export function defineCommand<
  const TArgs extends readonly PositionalArgDef[],
  const TOpts extends readonly OptionDef[],
>(def: CommandDef<TArgs, TOpts>): Command {
  return def as Command;
}
