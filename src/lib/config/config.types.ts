export interface KiwiConfig {
  /**
   * Define a custom root directory for scripts.
   * 
   * By default, the config loader reads from a `.kiwi/scripts/*` directory, either at
   * - the project root
   * - or the users home directory 
   * 
   * Supports relative paths using labels or the project root/cwd as base. 
   */
  scriptsDir?: string;
  /**
   * Define custom path labels in the form of `@label: path` as shortcuts. A label can define an absolute or relative path. 
   * Relative paths are rooted in the project root, or the `cwd` if no project root can be resolved.
   * 
   * By default, 2 labels are defined:
   * - `@cwd`: points to the current working directory (usually the directory from which the cli is invoked)
   * - `@root`: the resolved project root folder (or _cwd_, as described above)
   * 
   * @example
   * ```ts
   * pathLabels: {
   *   '@src': 'src' // points to '<root>/src'
   * }
   * ```
   */
  pathLabels?: Record<string, string>;
  /**
   * Define mappings for commands and their targeted cli. Allows the sole use of `kiwi` as the only command interface,
   * handling both native and external commands without specifying another cli.
   * 
   * By default, common mappings for `git` and `ng` (angular-cli) are already included. They can be overwritten by
   * specifying an identical command mapping, or removed entirely by including `disableDefaultAssociations = true`.
   * 
   * If a command is handled by kiwi itself (native or external scripts) has an associated cli and either
   * - cant process the arguments,
   * - was explicitly blocked for the supplied arguments,
   * - or threw an error during execution with the `passthroughOnFail`-option enabled,
   * 
   * then the command execution is redirected to the associated cli.
   * 
   * @example
   * ```ts
   * associations: {
   *   git: ['fetch', 'push', 'pull']
   * } // => invoking 'kiwi pull' becomes the same as 'git pull'
   * ```
   */
  associations?: Record<string, string[]>;
  /** Removes the default associations for angular and git cli. */
  disableDefaultAssociations?: boolean;
  /**
   * Define custom aliases for any command like `g: 'generate'`. Duplicate aliases will be ignored. (With a warning)
   * 
   * Similar to `associations`, some default aliases are defined for common angular commands.
   * 
   * Aliases are only for the primary command. Sub commands, arguments and flags define their aliases individually.\
   * Native aliases of external cli tools beyond the first command are irrelevant, as the input gets passed to the target
   * directly, so an alias `c: component` for angulars shortform `ng g c` (generate component) is not necessary and works regardless.
   * 
   * @example
   * ```ts
   * aliases: {
   *   g: 'generate'
   * } // => invoking 'kiwi g' becomes the same as 'kiwi generate'
   * ```
   * 
   * It is recommended to only define explicit commands for the associations and not aliased commands. Rather, define an alias for
   * the command, let it be resolved to the original and then associated with the target cli:
   * ```ts
   * associations: {
   *   ng: ['generate']
   * },
   * aliases: {
   *   g: 'generate'
   * }
   * ```
   * For the command `kiwi g c my-comp` kiwi will:
   * 1. resolve the alias to 'generate'
   * 2. look for native command handlers -> no result
   * 3. associate 'generate' to the angular cli (`ng`)
   * 4. execute the command `ng generate c my-comp`
   */
  aliases?: Record<string, string>;
  /** Removes the default aliases for angular. */
  disableDefaultAliases?: boolean;
}

/**
 * Typed helper function to define the config.
 * @usage
 * ```ts
 * // <project>/kiwi.config.ts
 * import { defineConfig } from '@kiwi/kiwi-cli';
 * 
 * export default defineConfig({
 *   // config...
 * })
 */
export function defineConfig(config: KiwiConfig): KiwiConfig {
  return config;
}