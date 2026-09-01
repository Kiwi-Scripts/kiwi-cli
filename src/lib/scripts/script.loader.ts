import { fsTree, kiwiPathsGlobal, logger } from '@kiwi-js/cli/api';
import { loadModule } from '@lib/core/module.loader';
import { registerScript, ScriptSource } from '@lib/scripts/script.registry';
import { Script } from '@lib/scripts/script.types';
import path from 'node:path';

const GLOBAL_SCRIPT_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.userHome, '.kiwi', 'scripts']);
const LOCAL_SCRIPT_DIR = kiwiPathsGlobal.resolve([kiwiPathsGlobal.projectRoot, '.kiwi', 'scripts']);

interface LoadedScriptModule {
  filePath: string;
  basename: string;
  script: Script;
  source: ScriptSource;
}

export async function loadScripts() {
  logger.debug('=== SCRIPT LOADER ===');
  logger.trace('Loading scripts from directories:', GLOBAL_SCRIPT_DIR, LOCAL_SCRIPT_DIR);
  const scriptModules = await loadScriptModules();
  const validModules = scriptModules.filter(validateScriptModule);
  validModules.forEach(mod => registerScript(mod.script, mod.source));

  if (validModules.length === 0) {
    logger.debug('No external scripts loaded.');
  } else {
    logger.debug(`[${validModules.length}] external scripts loaded`)
    logger.indent.ml.trace(...validModules.map(mod => mod.script.name));
  }
}

async function loadScriptModules() {
  const scriptModules: LoadedScriptModule[] = [];
  for (const dir of [GLOBAL_SCRIPT_DIR, LOCAL_SCRIPT_DIR]) {
    try {
      const files = fsTree.readDir(dir);
      for (const file of files) {
        const abs = path.join(dir, file);
        try {
          const mod = await loadModule(abs, { typeSuffix: 'script', extType: ['ts', 'js'], silent: true, requireDefaultExport: true });
          if (mod) {
            logger.trace(`Loaded script module from file: ${abs}`);
            const source: ScriptSource = dir === GLOBAL_SCRIPT_DIR ? 'user-global' : 'user-local';
            scriptModules.push({ filePath: abs, basename: file, script: mod.default, source });
          }
        } catch (error) {
          logger.warn(`Failed to load script module from file: ${abs}. Error: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.trace(`No script directory found at: ${dir}`);
    }
  }
  return scriptModules;
}

function validateScriptModule(mod: LoadedScriptModule) {
  if (typeof mod.script !== 'object') {
    logger.warn(`Script module ${mod.filePath} does not export a valid script object.`);
    return false;
  }
  if (typeof mod.script.name !== 'string') {
    logger.warn(`Script module ${mod.filePath} does not have a valid 'name' property.`);
    return false;
  }
  if (typeof mod.script.run !== 'function') {
    logger.warn(`Script module ${mod.filePath} does not declare a valid handler.`);
    return false;
  }
  return true;
}
