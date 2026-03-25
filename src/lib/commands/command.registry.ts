import healthCommand from '@commands/health.cmd';
import helpCommand from '@commands/help.cmd';
import initCommand from '@commands/init.cmd';
import uuidCommand from '@commands/uuid.command';
import versionCommand from '@commands/version.cmd';
import { Command } from '@lib/commands/command.types';
import { getConfig } from '@lib/config/config.loader';
import { KiwiConfigInternal } from '@lib/config/config.types';
import logger from '@lib/util/logger';

const commands = new Map<string, Command>();
const commandAliases = new Map<string, string>();

/** A union of all known (i.e. built-in) commands. */
export type KnownCommands = 'help' | 'version' | 'health' | 'init' | 'uuid';
export const ownCommands = [
  helpCommand,
  versionCommand,
  healthCommand,
  initCommand,
  uuidCommand,
] as const;
ownCommands.forEach(registerCommand);

export function registerCommand(command: Command) {
  if (commands.has(command.name)) {
    logger.warn(`Command '${command.name}' was registered before. Overwriting...`);
  }
  commands.set(command.name, command);
  registerAlias(command);
}

function registerAlias(command: Command) {
  if (!command.alias) return;
  if (commandAliases.has(command.alias)) {
    throw new Error(`Alias '${command.alias}' was already registered! (exisitng: '${commandAliases.get(command.alias)}', new: '${command.name}')`);
  }
  commandAliases.set(command.alias, command.name);
}

export function getCommand(name: KnownCommands): Command
export function getCommand(name: string): Command | undefined
export function getCommand(name: string) {
  return commands.get(name);
}

export function getAllCommands() {
  return [...commands.values()];
}

export function resolveAlias(alias: string) {
  return commandAliases.get(alias) ?? alias;
}

export function isKnownCommand(name: string): name is KnownCommands {
  return commands.has(name);
}

export async function runHelpCommand(command: string, args: string[], config?: KiwiConfigInternal) {
  const help = getCommand('help');
  await help.run({ command, rawArgs: args, config: config ?? getConfig(), positionalArgs: {}, options: {} });
}
