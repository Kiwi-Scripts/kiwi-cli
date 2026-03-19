import helpCommand from '@commands/help.cmd';
import versionCommand from '@commands/version.cmd';
import { Command, KnownCommands } from '@lib/commands/command.types';
import logger from '@lib/util/logger';

const commands = new Map<string, Command>();

export const ownCommands = [
  helpCommand,
  versionCommand
] as const;
ownCommands.forEach(registerCommand);

export function registerCommand(command: Command) {
  if (commands.has(command.name)) {
    logger.warn(`Command '${command.name}' was registered before. Overwriting...`);
  }
  commands.set(command.name, command);
}

export function getCommand(name: KnownCommands): Command
export function getCommand(name: string): Command | undefined
export function getCommand(name: string) {
  return commands.get(name);
}

export function getAllCommands() {
  return [...commands.values()];
}