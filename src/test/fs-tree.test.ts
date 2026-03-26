import { DryRunTree, HostTree, type FileAction, type FsTree } from '@lib/util/fs-tree';
import { loggerSpy } from '@testutil/logger-spy';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';


// === Helpers ==================================================

/** Create a unique temp directory for each test. */
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kiwi-test-'));
}

function cleanupDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function actionKinds(tree: FsTree): FileAction['kind'][] {
  return tree.actions.map(a => a.kind);
}

// =============================================================
// HostTree
// =============================================================

describe('HostTree', () => {
  let tmp: string;
  let tree: HostTree;

  beforeEach(() => {
    loggerSpy.clear();
    tmp = createTempDir();
    tree = new HostTree();
  });

  afterEach(() => {
    cleanupDir(tmp);
  });

  // --- createDir ---

  describe('createDir', () => {
    it('creates a new directory on disk', () => {
      const dir = path.join(tmp, 'sub', 'deep');
      tree.createDir(dir);

      expect(fs.existsSync(dir)).toBe(true);
      expect(fs.statSync(dir).isDirectory()).toBe(true);
    });

    it('records a create-dir action', () => {
      const dir = path.join(tmp, 'newdir');
      tree.createDir(dir);

      expect(tree.actions).toHaveLength(1);
      expect(tree.actions[0]).toEqual({ kind: 'create-dir', path: dir });
    });

    it('is a no-op for an already existing directory', () => {
      const dir = path.join(tmp, 'existing');
      fs.mkdirSync(dir);
      tree.createDir(dir); // should not throw

      expect(tree.actions).toHaveLength(1);
    });

    it('logs the create action', () => {
      tree.createDir(path.join(tmp, 'logged'));
      expect(loggerSpy.includes('log', 'CREATE')).toBe(true);
    });
  });

  // --- writeFile ---

  describe('writeFile', () => {
    it('writes a new file with correct content', () => {
      const file = path.join(tmp, 'hello.txt');
      tree.writeFile(file, 'world');

      expect(fs.readFileSync(file, 'utf-8')).toBe('world');
    });

    it('records create-file for a new file', () => {
      const file = path.join(tmp, 'new.txt');
      tree.writeFile(file, 'data');

      expect(actionKinds(tree)).toEqual(['create-file']);
      expect(tree.actions[0].content).toBe('data');
    });

    it('records overwrite-file when file already exists', () => {
      const file = path.join(tmp, 'existing.txt');
      fs.writeFileSync(file, 'old', 'utf-8');

      tree.writeFile(file, 'new');

      expect(actionKinds(tree)).toEqual(['overwrite-file']);
      expect(fs.readFileSync(file, 'utf-8')).toBe('new');
    });

    it('creates parent directories automatically', () => {
      const file = path.join(tmp, 'a', 'b', 'c.txt');
      tree.writeFile(file, 'deep');

      expect(fs.existsSync(file)).toBe(true);
    });

    it('logs the write action', () => {
      tree.writeFile(path.join(tmp, 'log.txt'), 'x');
      expect(loggerSpy.includes('log', 'CREATE')).toBe(true);
    });
  });

  // --- exists ---

  describe('exists', () => {
    it('returns true for existing file', () => {
      const file = path.join(tmp, 'ex.txt');
      fs.writeFileSync(file, '');
      expect(tree.exists(file)).toBe(true);
    });

    it('returns false for non-existing path', () => {
      expect(tree.exists(path.join(tmp, 'nope'))).toBe(false);
    });
  });

  // --- readFile ---

  describe('readFile', () => {
    it('reads an existing file', () => {
      const file = path.join(tmp, 'read.txt');
      fs.writeFileSync(file, 'contents', 'utf-8');
      expect(tree.readFile(file)).toBe('contents');
    });
  });

  // --- delete ---

  describe('delete', () => {
    it('deletes a file from disk', () => {
      const file = path.join(tmp, 'del.txt');
      fs.writeFileSync(file, 'gone');
      tree.delete(file);

      expect(fs.existsSync(file)).toBe(false);
    });

    it('deletes a directory recursively', () => {
      const dir = path.join(tmp, 'deldir');
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, 'child.txt'), 'x');
      tree.delete(dir);

      expect(fs.existsSync(dir)).toBe(false);
    });

    it('records a delete action', () => {
      const file = path.join(tmp, 'del2.txt');
      fs.writeFileSync(file, '');
      tree.delete(file);

      expect(actionKinds(tree)).toEqual(['delete']);
    });

    it('logs the delete action', () => {
      const file = path.join(tmp, 'del3.txt');
      fs.writeFileSync(file, '');
      tree.delete(file);
      expect(loggerSpy.includes('log', 'DELETE')).toBe(true);
    });
  });

  // --- logSummary ---

  describe('logSummary', () => {
    it('does not log anything (real mode)', () => {
      loggerSpy.clear();
      tree.writeFile(path.join(tmp, 'x.txt'), 'x');
      loggerSpy.clear(); // clear the write action logs
      tree.logSummary();

      expect(loggerSpy.entries).toHaveLength(0);
    });
  });

  // --- composite scenario ---

  describe('composite operations', () => {
    it('tracks multiple heterogeneous actions in order', () => {
      const dir = path.join(tmp, 'multi');
      const file1 = path.join(dir, 'a.txt');
      const file2 = path.join(dir, 'b.txt');

      tree.createDir(dir);
      tree.writeFile(file1, 'aaa');
      tree.writeFile(file2, 'bbb');
      tree.delete(file1);

      expect(actionKinds(tree)).toEqual(['create-dir', 'create-file', 'create-file', 'delete']);
      expect(tree.actions.map(a => a.path)).toEqual([dir, file1, file2, file1]);
    });
  });
});

// =============================================================
// DryRunTree
// =============================================================

describe('DryRunTree', () => {
  let tmp: string;
  let tree: DryRunTree;

  beforeEach(() => {
    loggerSpy.clear();
    tmp = createTempDir();
    tree = new DryRunTree();
  });

  afterEach(() => {
    cleanupDir(tmp);
  });

  // --- createDir ---

  describe('createDir', () => {
    it('does NOT create a directory on disk', () => {
      const dir = path.join(tmp, 'virtual');
      tree.createDir(dir);

      expect(fs.existsSync(dir)).toBe(false);
    });

    it('records the action', () => {
      const dir = path.join(tmp, 'vdir');
      tree.createDir(dir);

      expect(tree.actions).toHaveLength(1);
      expect(tree.actions[0]).toEqual({ kind: 'create-dir', path: dir });
    });

    it('makes the directory visible via exists()', () => {
      const dir = path.join(tmp, 'phantom');
      tree.createDir(dir);

      expect(tree.exists(dir)).toBe(true);
    });
  });

  // --- writeFile ---

  describe('writeFile', () => {
    it('does NOT write to disk', () => {
      const file = path.join(tmp, 'ghost.txt');
      tree.writeFile(file, 'boo');

      expect(fs.existsSync(file)).toBe(false);
    });

    it('records create-file for a new file', () => {
      const file = path.join(tmp, 'new.txt');
      tree.writeFile(file, 'data');

      expect(actionKinds(tree)).toEqual(['create-file']);
    });

    it('records overwrite-file when file already exists on disk', () => {
      const file = path.join(tmp, 'real.txt');
      fs.writeFileSync(file, 'old', 'utf-8');

      tree.writeFile(file, 'updated');

      expect(actionKinds(tree)).toEqual(['overwrite-file']);
      // Original file unchanged on disk
      expect(fs.readFileSync(file, 'utf-8')).toBe('old');
    });

    it('records overwrite-file when file was virtually created first', () => {
      const file = path.join(tmp, 'double.txt');
      tree.writeFile(file, 'first');
      tree.writeFile(file, 'second');

      expect(actionKinds(tree)).toEqual(['create-file', 'overwrite-file']);
    });

    it('stores content readable via readFile()', () => {
      const file = path.join(tmp, 'virtual-read.txt');
      tree.writeFile(file, 'hello dry');

      expect(tree.readFile(file)).toBe('hello dry');
    });
  });

  // --- exists ---

  describe('exists', () => {
    it('returns true for a real file on disk', () => {
      const file = path.join(tmp, 'real.txt');
      fs.writeFileSync(file, '');

      expect(tree.exists(file)).toBe(true);
    });

    it('returns true for a virtually created file', () => {
      const file = path.join(tmp, 'vf.txt');
      tree.writeFile(file, 'x');

      expect(tree.exists(file)).toBe(true);
    });

    it('returns true for a virtually created directory', () => {
      const dir = path.join(tmp, 'vd');
      tree.createDir(dir);

      expect(tree.exists(dir)).toBe(true);
    });

    it('returns false for a deleted real file', () => {
      const file = path.join(tmp, 'del.txt');
      fs.writeFileSync(file, 'x');
      tree.delete(file);

      expect(tree.exists(file)).toBe(false);
    });

    it('returns false for a path that was never created', () => {
      expect(tree.exists(path.join(tmp, 'nothing'))).toBe(false);
    });
  });

  // --- readFile ---

  describe('readFile', () => {
    it('reads a virtual file', () => {
      const file = path.join(tmp, 'vfile.txt');
      tree.writeFile(file, 'virtual content');

      expect(tree.readFile(file)).toBe('virtual content');
    });

    it('falls through to real file on disk', () => {
      const file = path.join(tmp, 'disk.txt');
      fs.writeFileSync(file, 'disk content', 'utf-8');

      expect(tree.readFile(file)).toBe('disk content');
    });

    it('virtual write overrides real file on disk for reads', () => {
      const file = path.join(tmp, 'override.txt');
      fs.writeFileSync(file, 'original', 'utf-8');
      tree.writeFile(file, 'overridden');

      expect(tree.readFile(file)).toBe('overridden');
      // Disk unchanged
      expect(fs.readFileSync(file, 'utf-8')).toBe('original');
    });

    it('throws when reading a deleted file', () => {
      const file = path.join(tmp, 'todelete.txt');
      fs.writeFileSync(file, 'x');
      tree.delete(file);

      expect(() => tree.readFile(file)).toThrow(/deleted/i);
    });
  });

  // --- delete ---

  describe('delete', () => {
    it('does NOT delete from disk', () => {
      const file = path.join(tmp, 'keep.txt');
      fs.writeFileSync(file, 'safe');
      tree.delete(file);

      expect(fs.existsSync(file)).toBe(true);
    });

    it('removes a virtual file from the tree', () => {
      const file = path.join(tmp, 'vdel.txt');
      tree.writeFile(file, 'temp');
      tree.delete(file);

      expect(tree.exists(file)).toBe(false);
    });

    it('removes a virtual directory from the tree', () => {
      const dir = path.join(tmp, 'vdeldir');
      tree.createDir(dir);
      tree.delete(dir);

      expect(tree.exists(dir)).toBe(false);
    });

    it('records a delete action', () => {
      tree.delete(path.join(tmp, 'anything'));
      expect(actionKinds(tree)).toEqual(['delete']);
    });

    it('marks a real path as deleted so exists() returns false', () => {
      const file = path.join(tmp, 'real-del.txt');
      fs.writeFileSync(file, 'x');
      tree.delete(file);

      expect(tree.exists(file)).toBe(false);
      // Still on disk though
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  // --- re-creation after delete ---

  describe('re-creation after delete', () => {
    it('can write a file after deleting it', () => {
      const file = path.join(tmp, 'phoenix.txt');
      tree.writeFile(file, 'first');
      tree.delete(file);
      tree.writeFile(file, 'reborn');

      expect(tree.exists(file)).toBe(true);
      expect(tree.readFile(file)).toBe('reborn');
      expect(actionKinds(tree)).toEqual(['create-file', 'delete', 'create-file']);
    });

    it('can create a dir after deleting it', () => {
      const dir = path.join(tmp, 'revived');
      tree.createDir(dir);
      tree.delete(dir);
      tree.createDir(dir);

      expect(tree.exists(dir)).toBe(true);
    });
  });

  // --- logSummary ---

  describe('logSummary', () => {
    it('logs a dry-run warning when actions were recorded', () => {
      tree.writeFile(path.join(tmp, 'x.txt'), 'x');
      loggerSpy.clear();
      tree.logSummary();

      expect(loggerSpy.includes('warn', '--dry-run')).toBe(true);
    });

    it('does not log when no actions were recorded', () => {
      loggerSpy.clear();
      tree.logSummary();

      expect(loggerSpy.entries).toHaveLength(0);
    });
  });

  // --- isFile ---

  describe('isFile', () => {
    it('returns true for a virtual file', () => {
      const file = path.join(tmp, 'vf.txt');
      tree.writeFile(file, 'x');
      expect(tree.isFile(file)).toBe(true);
    });

    it('returns false for a virtual directory', () => {
      const dir = path.join(tmp, 'vd');
      tree.createDir(dir);
      expect(tree.isFile(dir)).toBe(false);
    });

    it('returns false for a deleted file', () => {
      const file = path.join(tmp, 'df.txt');
      fs.writeFileSync(file, 'x');
      tree.delete(file);
      expect(tree.isFile(file)).toBe(false);
    });

    it('returns true for a real file on disk', () => {
      const file = path.join(tmp, 'real.txt');
      fs.writeFileSync(file, 'x');
      expect(tree.isFile(file)).toBe(true);
    });
  });

  // --- composite scenario ---

  describe('composite operations', () => {
    it('tracks all actions in order without touching the disk', () => {
      const dir = path.join(tmp, 'comp');
      const file1 = path.join(dir, 'a.txt');
      const file2 = path.join(dir, 'b.txt');

      tree.createDir(dir);
      tree.writeFile(file1, 'aaa');
      tree.writeFile(file2, 'bbb');
      tree.delete(file1);

      expect(actionKinds(tree)).toEqual(['create-dir', 'create-file', 'create-file', 'delete']);

      // Nothing on disk
      expect(fs.existsSync(dir)).toBe(false);
      expect(fs.existsSync(file1)).toBe(false);

      // Virtual state consistent
      expect(tree.exists(dir)).toBe(true);
      expect(tree.exists(file1)).toBe(false);
      expect(tree.exists(file2)).toBe(true);
      expect(tree.readFile(file2)).toBe('bbb');
    });
  });
});
