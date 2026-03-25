import DEFAULT_CONFIG from '@lib/config/config.default';
import { KiwiConfig, KiwiConfigInternal } from '@lib/config/config.types';
import logger from '@lib/util/logger';
import { loadModule } from '@lib/util/module.loader';
import { kiwiPathsGlobal } from '@lib/util/paths';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_FILENAME_EXTENSIONS = [
  // typescript
  ['.ts', '.mts', '.cts'],
  // raw javascript
  ['.js', '.mjs', '.cjs'],
  // plain JSON
  ['.json']
];
const CONFIG_FILENAME = 'kiwi.config'

let GLOBAL_CONFIG: KiwiConfigInternal | null = null;

export function getConfig() {
  if (!GLOBAL_CONFIG) {
    throw new Error('Config has not been loaded yet.');
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

  logger.debug('Final merged config:', finalConfig);
  GLOBAL_CONFIG = finalConfig as KiwiConfigInternal;
  return GLOBAL_CONFIG;
}

function doFindConfigFile(dir: string) {
  logger.debug('Checking for config file at:', dir);
  for (const ext of CONFIG_FILENAME_EXTENSIONS.flat()) {
    const candidate = path.join(dir, CONFIG_FILENAME + ext);
    if (fs.existsSync(candidate)) {
      logger.debug('Found config file:', candidate);
      // max one config per dir
      return candidate;
    }
  }
}

async function loadConfigFile(filePath: string) {
  logger.debug('Loading config module from:', filePath);
  try {
    return loadModule(filePath, { extType: ['ts', 'js', 'json'], requireDefaultExport: true });
  } catch (error) {
    logger.warn(`Failed to load config file: ${filePath}. Error: ${(error as Error).message}`);
    return {};
  }
}

function mergeConfigs(base: KiwiConfig, override: KiwiConfig) {
  logger.debug('Merging configs. Base:', base, 'Override:', override);
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
  logger.debug('Merging associations. Base:', base, 'Override:', override);
  const merged = {...base};
  if (override) {
    Object.keys(override).forEach(key => {
      const existing = merged[key] ?? [];
      merged[key] = [...existing, ...override[key]];
    });
  }
  return merged;
}