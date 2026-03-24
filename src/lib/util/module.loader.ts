import { KiwiConfig } from '@lib/config/config.types';
import logger from '@lib/util/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const MODULE_FILENAME_EXTENSIONS = [
  // typescript
  ['.ts', '.mts', '.cts'],
  // raw javascript
  ['.js', '.mjs', '.cjs'],
  // plain JSON
  ['.json']
];
const TS_EXTENSIONS = MODULE_FILENAME_EXTENSIONS[0];
const JS_EXTENSIONS = MODULE_FILENAME_EXTENSIONS[1];
const JSON_EXTENSIONS = MODULE_FILENAME_EXTENSIONS[2];

interface LoadModuleOptions {
  typeSuffix?: 'config' | 'command' | 'template' | 'script';
  /** Restricted the a */
  extType?: ('ts' | 'js' | 'json')[];
  /** Suppress errors and warnings. Returns `null` on failure. */
  silent?: boolean;
  /** Require TS/JS modules to have a default export. */
  requireDefaultExport?: boolean;
}

export async function loadModule(filePath: string, options: LoadModuleOptions = {}) {
  const ext = path.extname(filePath);

  if (!isAllowedTypeSuffix(filePath, options.typeSuffix, options.silent)) return null;

  if (JSON_EXTENSIONS.includes(ext)) {
    isAllowedExtension('json', options.extType, options.silent);
    return loadJsonModule(filePath);
  }

  if (JS_EXTENSIONS.includes(ext)) {
    isAllowedExtension('js', options.extType, options.silent);
    return assertDefaultExport(await loadJavaScriptModule(filePath, options.silent), filePath, options);
  }

  if(TS_EXTENSIONS.includes(ext)) {
    isAllowedExtension('ts', options.extType, options.silent);
    try {
      return assertDefaultExport(await loadTypeScriptModule(filePath, options.silent), filePath, options);
    } catch (error) {
      if (options.silent) return null;
      logger.ml.warn( 'Tried to load a typescript module and failed.',
        'Loading .ts files requires the optional dependency "tsx".',
        `Install it with: ${chalk.reset('npm install tsx')}`,
        'Or use a JS/JSON file instead.');
      logger.error(error);
    }
  }

  if (options.silent) return null;

  const basename = path.basename(filePath);
  logger.warn(`Unsupported file extension '${ext}' for module '${basename}'.`);
  throw new Error(`Unsupported module format: ${basename}`);
}

// === json loading =================================================

export function loadJsonModule(filePath: string) {
  const abs = assertFileExists(filePath);
  logger.debug('Loading JSON file:', abs);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

// === javascript loading ===========================================

export async function loadJavaScriptModule(filePath: string, silent = false) {
  const ext = path.extname(filePath);
  if (!JS_EXTENSIONS.includes(ext)) {
    if (silent) return null;
    throw new Error(`Invalid file type: ${filePath}. Only JavaScript files are supported.`);
  }
  const abs = assertFileExists(filePath);
  logger.debug('Loading JavaScript config file:', abs);
  const mod = await import(url.pathToFileURL(abs).href);
  return (mod.default ?? mod) as KiwiConfig;
}

// === typescript specific loading using tsx  =======================

export async function loadTypeScriptModule(filePath: string, silent = false) {
  const ext = path.extname(filePath);
  if (!TS_EXTENSIONS.includes(ext)) {
    if (silent) return null;
    throw new Error(`Invalid file type: ${filePath}. Only TypeScript files are supported.`);
  }

  const abs = assertFileExists(filePath);
  logger.debug('Loading TypeScript config file:', abs);
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

/** Asserts the the filepath exists. Returns the resolved path, or throws if its not found. */
function assertFileExists(filePath: string) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }
  return abs;
}

function isAllowedExtension(ext: string, allowedExtensions: string[] | undefined, silent = false) {
  if (!allowedExtensions) return true;
  if (allowedExtensions.includes(ext)) return true;
  if (silent) return false;
  throw new Error(`File extension ${ext} is not allowed for this module type.`);
}

function isAllowedTypeSuffix(filePath: string, typeSuffix: string | undefined, silent = false) {
  if (!typeSuffix) return true;
  const suffix = path.basename(filePath, path.extname(filePath)).split('.').pop();
  if (suffix === typeSuffix) return true;
  if (silent) return false;
  const basename = path.basename(filePath);
  throw new Error(`File ${basename} does not match the required type suffix '${typeSuffix}'.`);
}

function assertDefaultExport(mod: any, filePath: string, {required, silent}: {required?: boolean, silent?: boolean}) {
  if (!mod || (required && !mod.default)) {
    if (silent) return null;
    const basename = path.basename(filePath);
    throw new Error(`File ${basename} does not have a default export.`);
  }
  return mod;
}