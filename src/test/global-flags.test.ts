import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the logger before importing the module under test
vi.mock('@lib/util/logger', () => {
  const noop = () => {};
  const logger = { debug: noop, log: noop, warn: noop, error: noop, setLogLevel: noop };
  return { default: logger, setLogLevel: vi.fn() };
});

import { extractGlobalFlags } from '@lib/util/global-flags';
import { setLogLevel } from '@lib/util/logger';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractGlobalFlags', () => {
  it('removes --verbose and sets log level to debug', () => {
    const result = extractGlobalFlags(['build', '--verbose', '--output', 'dist']);
    expect(result).toEqual(['build', '--output', 'dist']);
    expect(setLogLevel).toHaveBeenCalledWith('debug');
  });

  it('returns args unchanged when no global flags present', () => {
    const args = ['build', '--output', 'dist'];
    const result = extractGlobalFlags(args);
    expect(result).toEqual(['build', '--output', 'dist']);
    expect(setLogLevel).not.toHaveBeenCalled();
  });

  it('handles --verbose as the only argument', () => {
    const result = extractGlobalFlags(['--verbose']);
    expect(result).toEqual([]);
    expect(setLogLevel).toHaveBeenCalledWith('debug');
  });

  it('handles empty args', () => {
    const result = extractGlobalFlags([]);
    expect(result).toEqual([]);
  });
});
