import { ArgType, ContextExecutables, ContextTools, InferParsed } from '@lib/util/types';

// === Input Definition =========================================

export interface ScriptInputDef {
  readonly name: string;
  readonly type: ArgType;
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: string | number | boolean;
}

// === Script Context ===========================================

export interface ScriptContext<
  TInput extends readonly ScriptInputDef[] = [],
> extends ContextExecutables {
  /** The resolved script name. */
  scriptName: string;
  /** Typed input derived from the script's input definitions. */
  input: InferParsed<TInput>;
}

// === Script Definition (generic, used at definition site) =====

export interface ScriptDef<
  TInput extends readonly ScriptInputDef[] = [],
  TOutput = void,
> {
  name: string;
  description?: string;
  input?: TInput;
  run(ctx: ScriptContext<TInput>, utils: ContextTools): TOutput | Promise<TOutput>;
}

// === Script (type-erased, used by the registry) ===============

export type Script = Readonly<ScriptDef<ScriptInputDef[], unknown>>;

// === defineScript Helper ======================================

/**
 * Define a typed script. The handler receives a fully typed
 * `ctx.input` inferred from the input definitions
 * and may return a typed output value.
 *
 * Returns a registry-compatible `Script`.
 */
export function defineScript<
  const TInput extends readonly ScriptInputDef[],
  TOutput = void,
>(def: ScriptDef<TInput, TOutput>): Script {
  return def as Script;
}
