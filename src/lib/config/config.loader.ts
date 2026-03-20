import DEFAULT_CONFIG from '@lib/config/config.default';
import { KiwiConfig } from '@lib/config/config.types';
import { kiwiPathsGlobal } from '@lib/util/paths';
import { loadTypeScriptModule } from '@lib/util/typescript.loader';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const CONFIG_FILENAME_EXTENSIONS = [
  // typescript
  ['.ts', '.mts', '.cts'],
  // raw javascript
  ['.js', '.mjs', '.cjs'],
  // plain JSON
  ['.json']
];
const CONFIG_FILENAME = 'kiwi.config'

export async function loadConfig() {
  const projectConfigFile = doFindConfigFile(kiwiPathsGlobal.projectRoot);
  const userConfigFile = doFindConfigFile(kiwiPathsGlobal.userHome);
  
  const userConfig = userConfigFile ? await loadConfigFile(userConfigFile) : {};
  const projectConfig = projectConfigFile ? await loadConfigFile(projectConfigFile) : {};

  const merged = mergeConfigs(userConfig, projectConfig);
  const defaultConfig = {...DEFAULT_CONFIG};
  if (merged.disableDefaultAssociations) delete defaultConfig.associations;
  if (merged.disableDefaultAliases) delete defaultConfig.aliases;
  return mergeConfigs(defaultConfig, merged);
}

function doFindConfigFile(dir: string) {
  for (const ext of CONFIG_FILENAME_EXTENSIONS.flat()) {
    const candidate = path.join(dir, CONFIG_FILENAME + ext);
    if (fs.existsSync(candidate)) {
      // max one config per dir
      return candidate;
    }
  }
}

async function loadConfigFile(filePath: string) {
  const abs = kiwiPathsGlobal.resolve(filePath);
  const ext = path.extname(abs);

  if (ext === '.json') {
    const raw = fs.readFileSync(abs, 'utf8');
    return JSON.parse(raw) as KiwiConfig;
  }

  if (CONFIG_FILENAME_EXTENSIONS[1].includes(ext)) {
    const mod = await import(url.pathToFileURL(abs).href);
    return (mod.default ?? mod) as KiwiConfig;
  }

  if(CONFIG_FILENAME_EXTENSIONS[0].includes(ext)) {
    const mod = await loadTypeScriptModule(abs);
    return (mod.default ?? mod) as KiwiConfig;
  }

  throw new Error(`Unsupported config format: ${filePath}, ${ext}`);
}

function mergeConfigs(base: KiwiConfig, override: KiwiConfig) {
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
  const merged = {...base};
  if (override) {
    Object.keys(override).forEach(key => {
      const existing = merged[key] ?? [];
      merged[key] = [...existing, ...override[key]];
    });
  }
  return merged;
}