import logger from '@lib/util/logger';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ensures that a directory exists. If it does not exist, it will be created or an error will be thrown based on the specified action.
 * @param dirPath The path to the directory to ensure.
 * @param actionOnMissing The action to take if the directory is missing ('throw' to throw an error, 'create' to create the directory).
 * @returns The path to the ensured directory.
 */
export function ensureDir(dirPath: string, actionOnMissing: 'throw' | 'create' = 'create') {
  if (!fs.existsSync(dirPath)) {
    if (actionOnMissing === 'throw') {
      throw new Error(`Directory does not exist: ${dirPath}`);
    } else if (actionOnMissing === 'create') {
      logger.debug(`Creating missing directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  return dirPath;
}

/** Ensures that a file exists. Throws an error if the file does not exist. */
export function ensureFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  return filePath;
}

/**
 * Searches for a file by name in a directory, optionally filtering by extensions. Returns the first match or null if not found.\
 * If more than one file matches, the first one is returned, with priority to the first encountered match, or the first match based on the order of extensions if provided.
 * @param dirPath The path to the directory to search in.
 * @param fileName The name of the file to search for (may include extension).
 * @param extensions An optional array of file extensions to filter by.
 * @returns The full path to the first matching file, or null if no match is found.
 */
export function findFileByName(dirPath: string, fileName: string, extensions?: string[]): string | null {
  const dir = ensureDir(dirPath, 'throw');
  const candidates = fs.readdirSync(dir);
  const matchingFiles = candidates.filter(candidate => {
    const fullPath = `${dir}/${candidate}`;
    const isFile = fs.statSync(fullPath).isFile();
    if (!isFile) return false;
    if (extensions && !extensions.includes(path.extname(candidate))) return false;
    return candidate.startsWith(fileName);
  });
  if (matchingFiles.length > 1) {
    if (extensions) {
      matchingFiles.sort((a, b) => {
        const extA = path.extname(a);
        const extB = path.extname(b);
        const indexA = extensions.indexOf(extA);
        const indexB = extensions.indexOf(extB);
        return indexA - indexB; // prioritize based on order in extensions array
      });
    }
    logger.warn(`Multiple files named "${fileName}" found in directory "${dirPath}". Returning the first match: "${matchingFiles[0]}"`);
  }
  return matchingFiles.length > 0 ? `${dir}/${matchingFiles[0]}` : null;
}