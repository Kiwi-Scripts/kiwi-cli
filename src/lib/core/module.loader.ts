import logger from '@lib/util/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const TS_EXTENSIONS = Object.freeze(['.ts', '.mts', '.cts']);
const JS_EXTENSIONS = Object.freeze(['.js', '.mjs', '.cjs']);
const JSON_EXTENSIONS = Object.freeze(['.json']);
export const MODULE_EXTENSIONS = Object.freeze({
  ts: TS_EXTENSIONS,
  js: JS_EXTENSIONS,
  json: JSON_EXTENSIONS
});
export type ModuleType = keyof typeof MODULE_EXTENSIONS;

export type TS_FILE = `${string}.ts` | `${string}.mts` | `${string}.cts`;
export type JS_FILE = `${string}.js` | `${string}.mjs` | `${string}.cjs`;
export type JSON_FILE = `${string}.json`;

interface LoadModuleOptions {
  typeSuffix?: 'config' | 'command' | 'template' | 'script';
  /** Restrict the allowed module types. */
  extType?: ModuleType[];
  /** Suppress errors and warnings. Returns `null` on failure. */
  silent?: boolean;
  /** Require TS/JS modules to have a default export. */
  requireDefaultExport?: boolean;
}

export async function loadModule(filePath: string, options: LoadModuleOptions = {}) {
  if (!isAllowedTypeSuffix(filePath, options.typeSuffix, options.silent)) return null;

  if (isJsonFile(filePath)) {
    isAllowedExtension('json', options.extType, options.silent);
    return loadJsonModule(filePath);
  }

  if (isJavaScriptFile(filePath)) {
    isAllowedExtension('js', options.extType, options.silent);
    return assertDefaultExport(await loadJavaScriptModule(filePath, options.silent), filePath, options);
  }

  if(isTypeScriptFile(filePath)) {
    isAllowedExtension('ts', options.extType, options.silent);
    try {
      return assertDefaultExport(await loadTypeScriptModule(filePath, options.silent), filePath, options);
    } catch (error) {
      if (options.silent) return terminateSilent(`Failed to load TypeScript module: '${filePath}'. Error: ${(error as Error).message}`);
      logger.ml.warn( 'Tried to load a typescript module and failed.',
        'Loading .ts files requires the optional dependency "tsx".',
        `Install it with: ${chalk.reset('npm install tsx')}`,
        'Or use a JS/JSON file instead.');
      logger.error(error);
    }
  }

  return terminate(`Unsupported module format: ${path.basename(filePath)}`, options.silent);
}

// === json loading =================================================

export function loadJsonModule(filePath: JSON_FILE) {
  const abs = assertFileExists(filePath);
  logger.debug('Loading JSON file:', abs);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

// === javascript loading ===========================================

export async function loadJavaScriptModule(filePath: JS_FILE, silent = false) {
  const abs = assertFileExists(filePath);
  logger.debug('Loading JavaScript file:', abs);
  const mod = await import(url.pathToFileURL(abs).href);
  return (mod.default ?? mod);
}

// === typescript specific loading using tsx  =======================

export async function loadTypeScriptModule(filePath: TS_FILE, silent = false) {
  const abs = assertFileExists(filePath);
  logger.debug('Loading TypeScript file:', abs);
  return await importWithTsx(abs);
}

async function importWithTsx(filePath: string) {
  const { tsImport } = await import('tsx/esm/api');
  const mod = await tsImport(url.pathToFileURL(filePath).href, {
    parentURL: import.meta.url
  });
  return mod;
}

// === helper functions =============================================

export function isTypeScriptFile(filePath: string): filePath is TS_FILE {
  return TS_EXTENSIONS.includes(path.extname(filePath));
}

export function isJavaScriptFile(filePath: string): filePath is JS_FILE {
  return JS_EXTENSIONS.includes(path.extname(filePath));
}

export function isJsonFile(filePath: string): filePath is JSON_FILE {
  return JSON_EXTENSIONS.includes(path.extname(filePath));
}

/** Asserts the the filepath exists. Returns the resolved path, or throws if its not found. */
function assertFileExists(filePath: string) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: '${abs}'`);
  }
  return abs;
}

function isAllowedExtension(ext: ModuleType, allowedExtensions: ModuleType[] | undefined, silent = false) {
  if (!allowedExtensions) return true;
  if (allowedExtensions.includes(ext)) return true;
  return terminate(`File extension '${ext}' is not allowed for this module type.`, silent);
}

function isAllowedTypeSuffix(filePath: string, typeSuffix: string | undefined, silent = false) {
  if (!typeSuffix) return true;
  const suffix = path.basename(filePath, path.extname(filePath)).split('.').pop();
  if (suffix === typeSuffix) return true;

  return terminate(`File '${path.basename(filePath)}' does not match the required type suffix '${typeSuffix}'.`, silent);
}

function assertDefaultExport(mod: any, filePath: string, {requireDefaultExport, silent}: Pick<LoadModuleOptions, 'requireDefaultExport' | 'silent'>) {
  if (!mod || (requireDefaultExport && !mod.default)) {
    return terminate(`Module '${path.basename(filePath)}' does not have a default export.`, silent);
  }
  logger.debug(`Module '${path.basename(filePath)}' has a default export.`);
  return mod;
}

function terminate(message: string, silent = false) {
  if (silent) return terminateSilent(message);
  throw new Error(message);
}

function terminateSilent(message: string) {
  logger.debug(message);
  return null;
}