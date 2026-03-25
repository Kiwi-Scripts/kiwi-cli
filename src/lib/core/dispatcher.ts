import { getCommand, resolveAlias as resolveAliasInternal } from '@lib/commands/command.registry';
import { Command, CommandContext } from '@lib/commands/command.types';
import { KiwiConfig, KiwiConfigInternal } from '@lib/config/config.types';
import { parseCommandArgs } from '@lib/core/arg-parser';
import { passthrough } from '@lib/core/passthrough';
import logger, { setLogLevel } from '@lib/util/logger';

/**
 * Parse raw argv. Strips the node binary and script path.
 */
export function parseArgv(argv: string[]) {
  const [command, ...args] = handleVerbose(argv.slice(2));
  return {command, args};
}

/**
 * Dispatches the command to the appropriate handler or CLI.
 * @param command The command to dispatch.
 * @param args The arguments passed to the command.
 * @param config The Kiwi configuration object containing aliases and associations.
 * @returns The result of the command execution.
 */
export async function dispatch(command: string | undefined, args: string[], config: KiwiConfigInternal) {
  if (!command) {
    command = 'help';
    logger.debug('No command provided. Defaulting to "help".');
  }
  if (args.includes('--help')) {
    args = [command, ...args.filter(arg => arg !== '--help')];
    command = 'help';
    logger.debug('Help flag detected. Routing to "help" command with args:', args);
  }

  const resolvedInternalCommand = resolveAliasInternal(command);
  const handler = getCommand(resolvedInternalCommand);
  if (handler) {
    logger.debug('Found handler for command:', resolvedInternalCommand);
    const ctx = resolveCommandContext(handler, args, config);
    logger.debug('Resolved command context:', ctx);
    return await handler.run(ctx);
  }

  const resolvedExternalCommand = resolveConfigAlias(command, config);
  logger.debug('No handler found for command, checking for passthrough:', resolvedExternalCommand);
  const [targetCli, ...params] = [resolveAssociation(resolvedExternalCommand, config), resolvedExternalCommand, ...args].filter(Boolean) as string[];
  const exitCode = await passthrough(targetCli, params);
  process.exitCode = exitCode;
}

/**
 * Resolves the command context by checking for aliases and associations in the configuration.
 * @param command The command to resolve.
 * @param args The arguments passed to the command.
 * @param config The Kiwi configuration object containing aliases and associations.
 * @returns The resolved command context.
 */
function resolveCommandContext(command: Command, args: string[], config: KiwiConfigInternal): CommandContext {
  const targetCli = resolveAssociation(command.name, config);
  const {positionalArgs, options} = parseCommandArgs(command, args);
  return {
    targetCli,
    command: command.name,
    rawArgs: args,
    positionalArgs,
    options,
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
function resolveConfigAlias(command: string, config: KiwiConfig) {
  const resolved = config.aliases?.[command];
  if (resolved) {
    logger.debug(`Resolved alias '${command}' to '${resolved}'`);
    return resolved;
  }
  return command;
}

function handleVerbose(args: string[]) {
  if (args.includes('--verbose')) {
    setLogLevel('debug');
    const cleanedArgs = [...args];
    cleanedArgs.splice(args.indexOf('--verbose'), 1);
    logger.debug('Verbose mode enabled. Arguments after removing --verbose:', cleanedArgs);
    return cleanedArgs;
  }
  return args;
}