import { FsTree } from '@lib/util/fs-tree';
import { Logger } from '@lib/util/logger';
import { PathResolver } from '@lib/util/paths';

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// === Type Mapping =============================================

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

export type ArgType = keyof TypeMap;

// === Inference Engine =========================================

type IsGuaranteed<T> =
  T extends { required: true } ? true :
  T extends { default: string | number | boolean } ? true :
  false;

export type InferParsed<Defs extends readonly { readonly name: string; readonly type: ArgType }[]> = Prettify<
  { [D in Defs[number] as IsGuaranteed<D> extends true ? D['name'] : never]: TypeMap[D['type']] }
  &
  { [D in Defs[number] as IsGuaranteed<D> extends true ? never : D['name']]?: TypeMap[D['type']] }
>;

// === Execution Context =========================================

export interface ContextTools {
  logger: Logger,
  kiwiPaths: PathResolver,
  kiwiPathsGlobal: PathResolver,
  fsTree: FsTree,
  fsUtils: typeof import('@lib/util/fs-utils'),
}

export interface ExecutableOptions {
  cwd?: string;
}

export interface ContextExecutables {
  /** Execute a command with inherited stdio (interactive). */
  exec(command: string, args?: string[], options?: ExecutableOptions): Promise<number>;
  /** Execute a command and capture its stdout/stderr. */
  capture(command: string, args?: string[], options?: ExecutableOptions): Promise<CaptureResult>;
  /** Prompt the user for input. */
  prompt(message: string, defaultValue?: string): Promise<string>;
}

export interface CaptureResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
