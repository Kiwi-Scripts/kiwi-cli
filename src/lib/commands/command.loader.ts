import { registerCommand } from '@lib/commands/command.registry';
import { Command } from '@lib/commands/command.types';
import logger from '@lib/util/logger';
import { loadModule } from '@lib/util/module.loader';
import { kiwiPathsGlobal } from '@lib/util/paths';
import fs from 'node:fs';
import path from 'node:path';

const GLOBAL_COMMAND_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.userHome, '.kiwi', 'commands']);
const LOCAL_COMMAND_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.projectRoot, '.kiwi', 'commands']);

interface LoadedCommandModule {
  filePath: string;
  basename: string;
  command: Command;
}

export async function loadCommands() {
  logger.debug('=== COMMAND LOADER ===');
  logger.debug('Loading commands from directories:', GLOBAL_COMMAND_DIR, LOCAL_COMMAND_DIR);
  const commandModules = await loadCommandModules();
  const validCommands: Command[] = commandModules.filter(validateCommandModule).map(mod => mod.command);
  if (logger.shouldLog('debug')) logger.ml.debug(`[${validCommands.length}] Commands loaded: ${validCommands.map(cmd => cmd.name).join(', ')}`);
  validCommands.forEach(registerCommand);
}

async function loadCommandModules() {
  // TODO: Consider supporting nested directories for better organization (e.g. `commands/build.ts`, `commands/deploy.ts`, etc.)
  // FIXME: Deep nesting and whacky error handling
  const commandModules: LoadedCommandModule[] = [];
  for (const dir of [GLOBAL_COMMAND_DIR, LOCAL_COMMAND_DIR]) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const abs = path.join(dir, file);
        try {
          const mod = await loadModule(abs, { typeSuffix: 'command', extType: ['ts', 'js'], silent: true, requireDefaultExport: true });
          if (mod) {
            logger.debug(`Loaded command module from file: ${abs}`);
            commandModules.push({ filePath: abs, basename: file, command: mod.default })
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