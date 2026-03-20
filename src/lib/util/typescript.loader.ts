import logger from '@lib/util/logger';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const tsFileExtension = /\.[mc]?ts$/;

export async function loadTypeScriptModule(filePath: string) {
  const baseName = path.basename(filePath);
  if (!tsFileExtension.test(baseName)) {
    throw new Error(`Invalid file type: ${baseName}. Only TypeScript files are supported.`);
  }

  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }

  try {
    return await importWithTsx(abs);
  } catch (error) {
    logger.warn(`TypeScript config detected: ${filePath}`);
    logger.log('  Loading .ts config files requires the optional dependency "tsx".');
    logger.log('  Install it with: npm install tsx');
    logger.log('  Or use kiwi.config.js / kiwi.config.json instead.')
    console.error(error);
  }
}

async function importWithTsx(filePath: string) {
  const { tsImport } = await import('tsx/esm/api');
  const mod = await tsImport(url.pathToFileURL(filePath).href, {
    parentURL: import.meta.url
  });
  return mod;
}