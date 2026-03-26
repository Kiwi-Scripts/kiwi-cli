import healthCommand from '@commands/health.cmd';
import helpCommand from '@commands/help.cmd';
import initCommand from '@commands/init.cmd';
import listCommand from '@commands/list.cmd';
import runCommand from '@commands/run.cmd';
import uuidCommand from '@commands/uuid.cmd';
import versionCommand from '@commands/version.cmd';
import { Command } from '@lib/commands/command.types';
import { getConfig } from '@lib/config/config.loader';
import { KiwiConfigInternal } from '@lib/config/config.types';
import logger from '@lib/util/logger';

export type CommandSource = 'builtin' | 'user-global' | 'user-local';

const commands = new Map<string, Command>();
const commandAliases = new Map<string, string>();
const commandSources = new Map<string, CommandSource>();

/** A union of all known (i.e. built-in) commands. */
export type KnownCommands = 'help' | 'version' | 'health' | 'init' | 'uuid' | 'list' | 'run';
export const ownCommands = [
  helpCommand,
  versionCommand,
  healthCommand,
  initCommand,
  uuidCommand,
  listCommand,
  runCommand
] as const;
ownCommands.forEach(cmd => registerCommand(cmd));

export function registerCommand(command: Command, source: CommandSource = 'builtin') {
  if (commands.has(command.name)) {
    logger.warn(`Command '${command.name}' was registered before. Overwriting...`);
  }
  commands.set(command.name, command);
  commandSources.set(command.name, source);
  registerAlias(command);
}

function registerAlias(command: Command) {
  if (!command.alias) return;
  if (commandAliases.has(command.alias)) {
    logger.warn(`Alias '${command.alias}' was already registered! (existing: '${commandAliases.get(command.alias)}', new: '${command.name}')`);
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

export function getCommandsBySource(source: CommandSource): Command[] {
  return [...commands.entries()]
    .filter(([name]) => commandSources.get(name) === source)
    .map(([, cmd]) => cmd);
}

export function getCommandAliases(): ReadonlyMap<string, string> {
  return commandAliases;
}

export function isKnownCommand(name: string): name is KnownCommands {
  return commands.has(name);
}

export async function runHelpCommand(command: string, args: string[], config?: KiwiConfigInternal) {
  const help = getCommand('help');
  await help.run({ command, rawArgs: args, config: config ?? getConfig(), positionalArgs: {}, options: {} });
}
