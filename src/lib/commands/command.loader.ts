import { CommandSource, registerCommand } from '@lib/commands/command.registry';
import { Command } from '@lib/commands/command.types';
import { loadModule } from '@lib/core/module.loader';
import fsTree from '@lib/util/fs-tree';
import logger from '@lib/util/logger';
import { kiwiPathsGlobal } from '@lib/util/paths';
import path from 'node:path';

const GLOBAL_COMMAND_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.userHome, '.kiwi', 'commands']);
const LOCAL_COMMAND_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.projectRoot, '.kiwi', 'commands']);

interface LoadedCommandModule {
  filePath: string;
  basename: string;
  command: Command;
  source: CommandSource;
}

export async function loadCommands() {
  logger.debug('=== COMMAND LOADER ===');
  logger.debug('Loading commands from directories:', GLOBAL_COMMAND_DIR, LOCAL_COMMAND_DIR);
  const commandModules = await loadCommandModules();
  const validModules = commandModules.filter(validateCommandModule);
  if (logger.shouldLog('debug')) logger.ml.debug(`[${validModules.length}] Commands loaded: ${validModules.map(mod => mod.command.name).join(', ')}`);
  validModules.forEach(mod => registerCommand(mod.command, mod.source));
}

async function loadCommandModules() {
  // TODO: Consider supporting nested directories for better organization (e.g. `commands/build.ts`, `commands/deploy.ts`, etc.)
  // FIXME: Deep nesting and whacky error handling
  const commandModules: LoadedCommandModule[] = [];
  for (const dir of [GLOBAL_COMMAND_DIR, LOCAL_COMMAND_DIR]) {
    try {
      const files = fsTree.readDir(dir);
      for (const file of files) {
        const abs = path.join(dir, file);
        try {
          const mod = await loadModule(abs, { typeSuffix: 'command', extType: ['ts', 'js'], silent: true, requireDefaultExport: true });
          if (mod) {
            logger.debug(`Loaded command module from file: ${abs}`);
            const source = dir === GLOBAL_COMMAND_DIR ? 'user-global' : 'user-local';
            commandModules.push({ filePath: abs, basename: file, command: mod.default, source })
          };
        } catch (error) {
          logger.warn(`Failed to load command module from file: ${abs}. Error: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.debug(`No command directory found at: ${dir}`);
    }
  }
  return commandModules;
}

function validateCommandModule(mod: LoadedCommandModule) {
  if (typeof mod.command !== 'object') {
    logger.warn(`Command module ${mod.filePath} does not export a valid command object.`);
    return false;
  }
  if (typeof mod.command.name !== 'string') {
    logger.warn(`Command module ${mod.filePath} does not have a valid 'name' property.`);
    return false;
  }
  if (typeof mod.command.run !== 'function') {
    logger.warn(`Command module ${mod.filePath} does not declare a valid handler.`);
    return false;
  }
  return true;
}