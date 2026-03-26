import { findProjectRoot, normalizeExternalPath, PathResolver } from '@lib/util/paths';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

// ── normalizeExternalPath ───────────────────────────────────────

describe('normalizeExternalPath', () => {
  it('normalizes backslashes to forward slashes', () => {
    expect(normalizeExternalPath('src\\app\\test')).toBe('src/app/test');
  });

  it('removes redundant slashes', () => {
    expect(normalizeExternalPath('src//app///test')).toBe('src/app/test');
  });

  it('removes leading ./', () => {
    expect(normalizeExternalPath('./src/app')).toBe('src/app');
  });

  it('preserves label prefixes', () => {
    expect(normalizeExternalPath('@src/components/button')).toBe('@src/components/button');
  });

  it('normalizes label path with backslashes', () => {
    expect(normalizeExternalPath('@src\\components\\button')).toBe('@src/components/button');
  });

  it('handles label-only input', () => {
    expect(normalizeExternalPath('@root')).toBe('@root');
  });

  it('throws on empty string', () => {
    expect(() => normalizeExternalPath('')).toThrow('Path input cannot be empty');
  });

  it('throws on whitespace-only string', () => {
    expect(() => normalizeExternalPath('   ')).toThrow('Path input cannot be empty');
  });

  it('joins array input with /', () => {
    expect(normalizeExternalPath(['src', 'app', 'test'])).toBe('src/app/test');
  });
});

// ── findProjectRoot ─────────────────────────────────────────────

describe('findProjectRoot', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwi-test-'));
  });

  it('finds root when package.json exists', () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    const nested = path.join(tempDir, 'src', 'lib');
    fs.mkdirSync(nested, { recursive: true });

    const root = findProjectRoot(nested);
    expect(path.normalize(root!)).toBe(path.normalize(tempDir));
  });

  it('returns null when no root found and requireProjectRoot is false', () => {
    // Use the temp dir itself which has no markers
    const root = findProjectRoot(tempDir, [], false);
    expect(root).toBeNull();
  });

  it('throws when no root found and requireProjectRoot is true', () => {
    expect(() => findProjectRoot(tempDir, [], true)).toThrow('Could not determine project root');
  });

  it('supports custom root markers', () => {
    fs.writeFileSync(path.join(tempDir, 'custom.marker'), '');
    const root = findProjectRoot(tempDir, ['custom.marker']);
    expect(path.normalize(root!)).toBe(path.normalize(tempDir));
  });
});

// ── PathResolver ────────────────────────────────────────────────

describe('PathResolver', () => {
  let tempDir: string;
  let resolver: PathResolver;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwi-path-'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
    resolver = new PathResolver({ cwd: tempDir });
  });

  it('sets projectRoot to cwd when package.json is there', () => {
    expect(path.normalize(resolver.projectRoot)).toBe(path.normalize(tempDir));
    expect(resolver.hasProjectRoot).toBe(true);
  });

  it('registers @cwd and @root labels by default', () => {
    expect(resolver.hasLabel('@cwd')).toBe(true);
    expect(resolver.hasLabel('@root')).toBe(true);
  });

  it('resolves absolute paths as-is', () => {
    const abs = path.resolve(tempDir, 'some', 'file.txt');
    expect(path.normalize(resolver.resolve(abs))).toBe(path.normalize(abs));
  });

  it('resolves relative paths from @root by default', () => {
    const result = resolver.resolve('src/lib');
    expect(path.normalize(result)).toBe(path.normalize(path.join(tempDir, 'src', 'lib')));
  });

  it('resolves labeled paths', () => {
    resolver.registerLabel('@src', 'src');
    const result = resolver.resolve('@src/components');
    expect(path.normalize(result)).toBe(path.normalize(path.join(tempDir, 'src', 'components')));
  });

  it('throws on unknown label', () => {
    expect(() => resolver.resolve('@unknown/path')).toThrow('Unknown path label');
  });

  it('throws on invalid label format', () => {
    expect(() => resolver.registerLabel('nope', 'src')).toThrow('Invalid label');
  });

  it('converts absolute path to labeled form', () => {
    resolver.registerLabel('@src', 'src');
    const abs = path.join(tempDir, 'src', 'components', 'button.ts');
    const labeled = resolver.toLabelPath(abs);
    expect(labeled).toBe('@src/components/button.ts');
  });

  it('converts absolute path to project-relative', () => {
    const abs = path.join(tempDir, 'src', 'index.ts');
    const relative = resolver.toProjectRelative(abs);
    expect(relative).toBe('src/index.ts');
  });

  it('listLabels returns labels with relative paths', () => {
    resolver.registerLabel('@src', 'src');
    const labels = resolver.listLabels();
    expect(labels['@src']).toBe('src');
    expect(labels['@root']).toBe('.');
  });

  it('resolve with mustExist throws when path does not exist', () => {
    expect(() => resolver.resolve('nonexistent/file.ts', { mustExist: true })).toThrow(
      'Resolved path does not exist',
    );
  });

  it('resolve with mustExist succeeds when path exists', () => {
    const filePath = path.join(tempDir, 'existing.txt');
    fs.writeFileSync(filePath, '');
    const result = resolver.resolve('existing.txt', { mustExist: true });
    expect(path.normalize(result)).toBe(path.normalize(filePath));
  });

  it('uses custom labels from options', () => {
    const customResolver = new PathResolver({
      cwd: tempDir,
      labels: { '@custom': 'custom-dir' },
    });
    expect(customResolver.hasLabel('@custom')).toBe(true);
  });

  it('falls back to cwd when no project root found', () => {
    const noRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwi-noroot-'));
    const r = new PathResolver({ cwd: noRootDir, requireProjectRoot: false });
    expect(path.normalize(r.projectRoot)).toBe(path.normalize(noRootDir));
    expect(r.hasProjectRoot).toBe(false);
  });
});
