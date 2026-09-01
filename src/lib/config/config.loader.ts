import { findFileByName, kiwiPathsGlobal, logger } from '@kiwi-js/cli/api';
import DEFAULT_CONFIG from '@lib/config/config.default';
import { KiwiConfig, KiwiConfigInternal } from '@lib/config/config.types';
import { loadModule, MODULE_EXTENSIONS } from '@lib/core/module.loader';
import { ConfigError } from '@lib/errors/config.error';

const CONFIG_FILENAME = 'kiwi.config'

let GLOBAL_CONFIG: KiwiConfigInternal | null = null;

export function getConfig() {
  if (!GLOBAL_CONFIG) {
    throw new ConfigError('Config has not been loaded yet.');
  }
  return GLOBAL_CONFIG;
}

export async function loadConfig() {
  const projectConfigFile = doFindConfigFile(kiwiPathsGlobal.projectRoot);
  const userConfigFile = doFindConfigFile(kiwiPathsGlobal.userHome);
  
  const userConfig = userConfigFile ? await loadConfigFile(userConfigFile) : {};
  const projectConfig = projectConfigFile ? await loadConfigFile(projectConfigFile) : {};

  const merged = mergeConfigs(userConfig, projectConfig);
  const defaultConfig = {...DEFAULT_CONFIG};
  if (merged.disableDefaultAssociations) delete defaultConfig.associations;
  if (merged.disableDefaultAliases) delete defaultConfig.aliases;
  const finalConfig = mergeConfigs(defaultConfig, merged);

  const usedConfigFiles: string[] = ['DEFAULT_CONFIG'];
  if (userConfigFile) usedConfigFiles.push(userConfigFile);
  if (projectConfigFile) usedConfigFiles.push(projectConfigFile);
  (finalConfig as KiwiConfigInternal).usedConfigFiles = usedConfigFiles;

  logger.ml.trace('Final merged config:', finalConfig);
  GLOBAL_CONFIG = finalConfig as KiwiConfigInternal;
  return GLOBAL_CONFIG;
}

function doFindConfigFile(dir: string) {
  logger.trace('Checking for config file at:', dir);
  const extensions = Object.values(MODULE_EXTENSIONS).flat();
  const result = findFileByName(dir, CONFIG_FILENAME, extensions);
  result ? logger.trace(`Found config file: ${result}`) : logger.trace('No config file found.');
  return result;
}

async function loadConfigFile(filePath: string) {
  logger.trace('Loading config module from:', filePath);
  try {
    return loadModule(filePath, { requireDefaultExport: true });
  } catch (error) {
    logger.warn(`Failed to load config file: ${filePath}. Error: ${(error as Error).message}`);
    return {};
  }
}

function mergeConfigs(base: KiwiConfig, override: KiwiConfig) {
  logger.ml.trace('Merging configs. Base:', base, 'Override:', override);
  const merged: KiwiConfig = {
    scriptsDir: override.scriptsDir ?? base.scriptsDir,
    pathLabels: {...base.pathLabels, ...override.pathLabels},
    aliases: {...base.aliases, ...override.aliases},
    associations: mergeAssociations(base.associations, override.associations),
    disableDefaultAssociations: override.disableDefaultAssociations ?? base.disableDefaultAssociations ,
    disableDefaultAliases: override.disableDefaultAliases ?? base.disableDefaultAliases
  }
  return merged;
}

function mergeAssociations(base: KiwiConfig['associations'], override: KiwiConfig['associations']) {
  logger.ml.trace('Merging associations. Base:', base, 'Override:', override);
  const merged = {...base};
  if (override) {
    Object.keys(override).forEach(key => {
      const existing = merged[key] ?? [];
      merged[key] = [...new Set([...existing, ...override[key]])];
    });
  }
  return merged;
}