import { KiwiConfigInternal } from '@lib/config/config.types';
import { Prettify } from '@lib/util/types';

// === Type Mapping =============================================

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

type ArgType = keyof TypeMap;

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
}

// === Inference Engine =========================================

/**
 * A value is guaranteed (non-optional) if `required: true`
 * or an explicit `default` is provided.
 */
type IsGuaranteed<T> =
  T extends { required: true } ? true :
  T extends { default: string | number | boolean } ? true :
  false;

/**
 * Maps a tuple of arg/option defs into a typed object.
 *
 * Given: [{ name: 'count', type: 'number', required: true }, { name: 'verbose', type: 'boolean' }]
 * Produces: { count: number; verbose?: boolean }
 */
type InferParsed<Defs extends readonly { readonly name: string; readonly type: ArgType }[]> = Prettify<
  // Guaranteed keys → required properties
  { [D in Defs[number] as IsGuaranteed<D> extends true ? D['name'] : never]: TypeMap[D['type']] }
  &
  // Non-guaranteed keys → optional properties
  { [D in Defs[number] as IsGuaranteed<D> extends true ? never : D['name']]?: TypeMap[D['type']] }
>;

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

export interface CommandDef<
  TArgs extends readonly PositionalArgDef[] = [],
  TOpts extends readonly OptionDef[] = [],
> {
  name: string;
  description?: string;
  alias?: string;
  positionalArgs?: TArgs;
  options?: TOpts;
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
