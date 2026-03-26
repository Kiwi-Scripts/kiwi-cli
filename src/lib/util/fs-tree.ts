import { FileSystemError } from '@lib/errors/fs.error';
import { globalFlags } from '@lib/util/global-flags';
import lazySingleton from '@lib/util/lazy-singleton';
import logger from '@lib/util/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

export type FileActionKind = 'create-dir' | 'create-file' | 'overwrite-file' | 'delete';

export interface FileAction {
  readonly kind: FileActionKind;
  readonly path: string;
  readonly content?: string;
}

const ACTION_LABELS: Record<FileActionKind, string> = {
  'create-dir': 'CREATE',
  'create-file': 'CREATE',
  'overwrite-file': 'UPDATE',
  'delete': 'DELETE',
};

const ACTION_COLORS: Record<FileActionKind, (s: string) => string> = {
  'create-dir': chalk.green,
  'create-file': chalk.green,
  'overwrite-file': chalk.blue,
  'delete': chalk.red,
};

/**
 * Virtual filesystem tree abstraction inspired by Angular CLI's Tree.
 * 
 * All file-writing operations should go through this interface. In normal mode,
 * operations execute against the real filesystem. In `--dry-run` mode, operations
 * are recorded virtually — no real changes are made.
 * 
 * Consumers never need to check the dry-run flag themselves.
 */
export interface FsTree {
  /**
   * Access to the underlying host filesystem module through `node:fs`.\
   * This allows direct interaction with the real filesystem if needed.
   * 
   * USE WITH CARE AS IT BYPASSES `--dry-run` SAFEGUARDS!\
   * Intended for complex operations that are not easily abstracted, to remove the need to import the fs module separately.
   */
  readonly host: typeof fs;
  /** Create a directory (recursive). No-op if it already exists. */
  createDir(dirPath: string): void;
  /** Write a file. Creates parent directories as needed. */
  writeFile(filePath: string, content: string): void;
  /** Check whether a path exists (considers virtual state in dry-run). */
  exists(targetPath: string): boolean;
  /** Read a file (considers virtual state in dry-run). */
  readFile(filePath: string): string;
  /** Delete a file or directory. */
  delete(targetPath: string): void;
  /** All recorded actions performed through this tree. */
  readonly actions: readonly FileAction[];
  /** Print a summary note (only relevant for dry-run). */
  logSummary(): void;
}

// === Base =====================================================

abstract class BaseFsTree implements FsTree {
  protected readonly _actions: FileAction[] = [];
  readonly host = fs;

  get actions(): readonly FileAction[] {
    return this._actions;
  }

  abstract createDir(dirPath: string): void;
  abstract writeFile(filePath: string, content: string): void;
  abstract exists(targetPath: string): boolean;
  abstract readDir(dirPath: string): string[];
  abstract readFile(filePath: string): string;
  abstract isFile(targetPath: string): boolean;
  abstract delete(targetPath: string): void;
  abstract logSummary(): void;

  protected record(action: FileAction): void {
    this._actions.push(action);
    this.logAction(action);
  }

  protected logAction(action: FileAction): void {
    const label = ACTION_LABELS[action.kind];
    const color = ACTION_COLORS[action.kind];
    logger.log(`${color(`[${label}]`)} ${action.path}`);
  }
}

// === HostTree — real filesystem ===============================

export class HostTree extends BaseFsTree {
  createDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    this.record({ kind: 'create-dir', path: dirPath });
  }

  writeFile(filePath: string, content: string): void {
    const existed = fs.existsSync(filePath);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    this.record({ kind: existed ? 'overwrite-file' : 'create-file', path: filePath, content });
  }

  exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  readDir(dirPath: string): string[] {
    return fs.readdirSync(dirPath);
  }

  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  isFile(targetPath: string): boolean {
    return fs.statSync(targetPath).isFile();
  }

  delete(targetPath: string): void {
    fs.rmSync(targetPath, { recursive: true, force: true });
    this.record({ kind: 'delete', path: targetPath });
  }

  logSummary(): void {
    // Real operations already applied — nothing to summarize.
  }
}

// === DryRunTree — virtual filesystem ==========================

export class DryRunTree extends BaseFsTree {
  private readonly virtualFiles = new Map<string, string>();
  private readonly virtualDirs = new Set<string>();
  private readonly deletedPaths = new Set<string>();

  createDir(dirPath: string): void {
    this.virtualDirs.add(dirPath);
    this.deletedPaths.delete(dirPath);
    this.record({ kind: 'create-dir', path: dirPath });
  }

  writeFile(filePath: string, content: string): void {
    const existed = this.exists(filePath);
    this.virtualFiles.set(filePath, content);
    this.deletedPaths.delete(filePath);
    this.record({ kind: existed ? 'overwrite-file' : 'create-file', path: filePath, content });
  }

  exists(targetPath: string): boolean {
    if (this.deletedPaths.has(targetPath)) return false;
    if (this.virtualFiles.has(targetPath)) return true;
    if (this.virtualDirs.has(targetPath)) return true;
    return fs.existsSync(targetPath);
  }

  readDir(dirPath: string): string[] {
    if (this.deletedPaths.has(dirPath)) {
      throw new FileSystemError(`Directory was deleted`, dirPath);
    }
    const virtualDirs = [...this.virtualDirs].filter(d => d.startsWith(dirPath));
    const virtualFiles = [...this.virtualFiles.keys()].filter(f => f.startsWith(dirPath));
    const realFiles = fs.existsSync(dirPath) ? fs.readdirSync(dirPath).map(f => path.join(dirPath, f)) : [];
    return [...virtualDirs, ...virtualFiles, ...realFiles].filter(p => !this.deletedPaths.has(p)).map(p => path.relative(dirPath, p).split(path.sep)[0]);
  }

  readFile(filePath: string): string {
    if (this.deletedPaths.has(filePath)) {
      throw new FileSystemError(`File was deleted`, filePath);
    }
    const virtual = this.virtualFiles.get(filePath);
    if (virtual !== undefined) return virtual;
    return fs.readFileSync(filePath, 'utf-8');
  }

  isFile(targetPath: string): boolean {
    if (this.deletedPaths.has(targetPath)) return false;
    if (this.virtualFiles.has(targetPath)) return true;
    if (this.virtualDirs.has(targetPath)) return false;
    return fs.existsSync(targetPath) && fs.statSync(targetPath).isFile();
  }

  delete(targetPath: string): void {
    this.deletedPaths.add(targetPath);
    this.virtualFiles.delete(targetPath);
    this.virtualDirs.delete(targetPath);
    this.record({ kind: 'delete', path: targetPath });
  }

  logSummary(): void {
    if (this._actions.length > 0) {
      logger.np.log();
      logger.warn(`The ${chalk.green('--dry-run')} flag was specified. No changes were made.`);
    }
  }
}

// === Singleton ================================================

export const fsTree = lazySingleton.factory(() => globalFlags.dryRun ? new DryRunTree() : new HostTree());
export default fsTree;
