import { getCommand } from '@lib/commands/command.registry';
import { CommandContext } from '@lib/commands/command.types';
import { KiwiConfig } from '@lib/config/config.types';
import { passthrough } from '@lib/core/passthrough';

export interface DispatchOptions {
  // Options for dispatch execution
}

/**
 * Parse raw argv. Strips the node binary and script path.
 */
export function parseArgv(argv: string[]) {
  const [command, ...args] = argv.slice(2);
  return {command, args};
}

/**
 * Dispatches the command to the appropriate handler or CLI.
 * @param command The command to dispatch.
 * @param args The arguments passed to the command.
 * @param config The Kiwi configuration object containing aliases and associations.
 * @returns The result of the command execution.
 */
export async function dispatch(command: string, args: string[], config: KiwiConfig = {}) {
  const ctx = resolveCommandContext(command, args, config);

  if (!command) {
    const help = getCommand('help');
    return await help.run(ctx);
  }

  const handler = getCommand(command);
  if (handler) {
    return await handler.run(ctx);
  }

  const [targetCli, ...params] = ctx.targetCli ? [ctx.targetCli, ctx.command, ...ctx.args] : [ctx.command, ...ctx.args];
  const exitCode = await passthrough(targetCli, ...params);
  process.exitCode = exitCode;
}

/**
 * Resolves the command context by checking for aliases and associations in the configuration.
 * @param command The command to resolve.
 * @param args The arguments passed to the command.
 * @param config The Kiwi configuration object containing aliases and associations.
 * @returns The resolved command context.
 */
function resolveCommandContext(command: string, args: string[], config: KiwiConfig): CommandContext {
  const resolvedCommand = resolveAlias(command, config);
  const targetCli = resolveAssociation(resolvedCommand, config);
  return {
    targetCli,
    command: resolvedCommand,
    args,
    config
  }
}

/**
 * Compares the command to all associations defined in the config and returns the associated CLI if a match is found.
 * @param command The command to check for associations.
 * @param config The Kiwi configuration object containing associations.
 * @returns The associated CLI if a match is found, otherwise undefined.
 */
function resolveAssociation(command: string | undefined, config: KiwiConfig) {
  if (command) {
    for (const [key, value] of Object.entries(config.associations ?? {})) {
      if (value.includes(command)) {
        return key;
      }
    }
  }
  return undefined;
}

/**
 * Checks if the provided command matches any alias defined in the configuration and returns the resolved command.
 * @param command The command to check for aliases.
 * @param config The Kiwi configuration object containing aliases.
 * @returns The resolved command if an alias is found, otherwise the original command.
 */
function resolveAlias(command: string, config: KiwiConfig) {
  if (config.aliases?.[command]) {
    return config.aliases[command];
  }
  return command;
}