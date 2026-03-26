import { Command } from '@lib/commands/command.types';
import { parseCommandArgs } from '@lib/core/arg-parser';
import { describe, expect, it } from 'vitest';

/** Helper to build a minimal command definition for testing. */
function cmd(overrides: Partial<Command> = {}): Command {
  return {
    name: 'test-cmd',
    run: () => {},
    ...overrides,
  };
}

describe('parseCommandArgs', () => {
  // ── Positional Arguments ──────────────────────────────────────

  describe('positional arguments', () => {
    it('parses a single positional argument', () => {
      const command = cmd({
        positionalArgs: [{ name: 'target', type: 'string' }],
      });
      const result = parseCommandArgs(command, ['hello']);
      expect(result.positionalArgs).toEqual({ target: 'hello' });
    });

    it('parses multiple positional arguments', () => {
      const command = cmd({
        positionalArgs: [
          { name: 'first', type: 'string' },
          { name: 'second', type: 'string' },
        ],
      });
      const result = parseCommandArgs(command, ['a', 'b']);
      expect(result.positionalArgs).toEqual({ first: 'a', second: 'b' });
    });

    it('coerces positional to number', () => {
      const command = cmd({
        positionalArgs: [{ name: 'count', type: 'number' }],
      });
      const result = parseCommandArgs(command, ['42']);
      expect(result.positionalArgs).toEqual({ count: 42 });
    });

    it('applies default for missing optional positional', () => {
      const command = cmd({
        positionalArgs: [{ name: 'env', type: 'string', default: 'dev' }],
      });
      const result = parseCommandArgs(command, []);
      expect(result.positionalArgs).toEqual({ env: 'dev' });
    });

    it('throws on too many positional arguments', () => {
      const command = cmd({
        positionalArgs: [{ name: 'only', type: 'string' }],
      });
      expect(() => parseCommandArgs(command, ['a', 'b'])).toThrow('Too many positional arguments');
    });

    it('throws on missing required positional argument', () => {
      const command = cmd({
        positionalArgs: [{ name: 'target', type: 'string', required: true }],
      });
      expect(() => parseCommandArgs(command, [])).toThrow('Missing required positional argument');
    });

    it('throws on invalid number coercion for positional', () => {
      const command = cmd({
        positionalArgs: [{ name: 'count', type: 'number' }],
      });
      expect(() => parseCommandArgs(command, ['abc'])).toThrow('Expected a number');
    });
  });

  // ── Long Options ──────────────────────────────────────────────

  describe('long options', () => {
    it('parses --name value (separate)', () => {
      const command = cmd({
        options: [{ name: 'name', type: 'string' }],
      });
      const result = parseCommandArgs(command, ['--name', 'kiwi']);
      expect(result.options).toEqual({ name: 'kiwi' });
    });

    it('parses --name=value (inline)', () => {
      const command = cmd({
        options: [{ name: 'name', type: 'string' }],
      });
      const result = parseCommandArgs(command, ['--name=kiwi']);
      expect(result.options).toEqual({ name: 'kiwi' });
    });

    it('parses inline value with multiple = signs', () => {
      const command = cmd({
        options: [{ name: 'equation', type: 'string' }],
      });
      const result = parseCommandArgs(command, ['--equation=1=2']);
      expect(result.options).toEqual({ equation: '1=2' });
    });

    it('parses number option', () => {
      const command = cmd({
        options: [{ name: 'port', type: 'number' }],
      });
      const result = parseCommandArgs(command, ['--port', '3000']);
      expect(result.options).toEqual({ port: 3000 });
    });

    it('throws on unknown long option', () => {
      const command = cmd();
      expect(() => parseCommandArgs(command, ['--unknown'])).toThrow('Unknown option: --unknown');
    });

    it('throws when option requires a value but none given', () => {
      const command = cmd({
        options: [{ name: 'name', type: 'string' }],
      });
      expect(() => parseCommandArgs(command, ['--name'])).toThrow('requires a value');
    });
  });

  // ── Short Options ─────────────────────────────────────────────

  describe('short options', () => {
    it('parses -n value (separate)', () => {
      const command = cmd({
        options: [{ name: 'name', type: 'string', aliases: ['n'] }],
      });
      const result = parseCommandArgs(command, ['-n', 'kiwi']);
      expect(result.options).toEqual({ name: 'kiwi' });
    });

    it('parses -n=value (inline)', () => {
      const command = cmd({
        options: [{ name: 'name', type: 'string', aliases: ['n'] }],
      });
      const result = parseCommandArgs(command, ['-n=kiwi']);
      expect(result.options).toEqual({ name: 'kiwi' });
    });

    it('throws on unknown short option', () => {
      const command = cmd();
      expect(() => parseCommandArgs(command, ['-x'])).toThrow('Unknown option: -x');
    });
  });

  // ── Boolean Flags ─────────────────────────────────────────────

  describe('boolean flags', () => {
    it('treats --flag as true when no value follows', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean', aliases: ['v'] }],
      });
      const result = parseCommandArgs(command, ['--verbose']);
      expect(result.options).toEqual({ verbose: true });
    });

    it('parses --flag true', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      const result = parseCommandArgs(command, ['--verbose', 'true']);
      expect(result.options).toEqual({ verbose: true });
    });

    it('parses --flag false', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      const result = parseCommandArgs(command, ['--verbose', 'false']);
      expect(result.options).toEqual({ verbose: false });
    });

    it('parses --flag yes / no', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      expect(parseCommandArgs(command, ['--verbose', 'yes']).options).toEqual({ verbose: true });
      expect(parseCommandArgs(command, ['--verbose', 'no']).options).toEqual({ verbose: false });
    });

    it('parses --flag 1 / 0', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      expect(parseCommandArgs(command, ['--verbose', '1']).options).toEqual({ verbose: true });
      expect(parseCommandArgs(command, ['--verbose', '0']).options).toEqual({ verbose: false });
    });

    it('parses --flag=true inline', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      const result = parseCommandArgs(command, ['--verbose=true']);
      expect(result.options).toEqual({ verbose: true });
    });

    it('rejects invalid boolean value inline', () => {
      const command = cmd({
        options: [{ name: 'verbose', type: 'boolean' }],
      });
      expect(() => parseCommandArgs(command, ['--verbose=maybe'])).toThrow('Invalid boolean value');
    });
  });

  // ── Short Flag Clusters ───────────────────────────────────────

  describe('short flag clusters', () => {
    it('parses -abc as three boolean flags', () => {
      const command = cmd({
        options: [
          { name: 'alpha', type: 'boolean', aliases: ['a'] },
          { name: 'beta', type: 'boolean', aliases: ['b'] },
          { name: 'gamma', type: 'boolean', aliases: ['c'] },
        ],
      });
      const result = parseCommandArgs(command, ['-abc']);
      expect(result.options).toEqual({ alpha: true, beta: true, gamma: true });
    });

    it('allows last flag in cluster to take a value', () => {
      const command = cmd({
        options: [
          { name: 'alpha', type: 'boolean', aliases: ['a'] },
          { name: 'beta', type: 'boolean', aliases: ['b'] },
          { name: 'config', type: 'string', aliases: ['c'] },
        ],
      });
      const result = parseCommandArgs(command, ['-abc', 'file.json']);
      expect(result.options).toEqual({ alpha: true, beta: true, config: 'file.json' });
    });

    it('throws if non-last flag in cluster is not boolean', () => {
      const command = cmd({
        options: [
          { name: 'config', type: 'string', aliases: ['c'] },
          { name: 'verbose', type: 'boolean', aliases: ['v'] },
        ],
      });
      expect(() => parseCommandArgs(command, ['-cv'])).toThrow('must be a boolean to be used in a cluster');
    });
  });

  // ── End-of-Options Separator (--) ─────────────────────────────

  describe('-- separator', () => {
    it('treats everything after -- as positional', () => {
      const command = cmd({
        positionalArgs: [
          { name: 'first', type: 'string' },
          { name: 'second', type: 'string' },
        ],
      });
      const result = parseCommandArgs(command, ['--', '--not-an-option']);
      expect(result.positionalArgs).toEqual({ first: '--not-an-option' });
      expect(result.options).toEqual({});
    });

    it('mixes positionals, options, and -- separator', () => {
      const command = cmd({
        positionalArgs: [
          { name: 'first', type: 'string' },
          { name: 'second', type: 'string' },
        ],
        options: [{ name: 'opt', type: 'string' }],
      });
      const result = parseCommandArgs(command, ['pos1', '--opt', 'val', '--', '-hi']);
      expect(result.positionalArgs).toEqual({ first: 'pos1', second: '-hi' });
      expect(result.options).toEqual({ opt: 'val' });
    });
  });

  // ── Defaults & Required ───────────────────────────────────────

  describe('defaults and required options', () => {
    it('applies default value for missing option', () => {
      const command = cmd({
        options: [{ name: 'env', type: 'string', default: 'production' }],
      });
      const result = parseCommandArgs(command, []);
      expect(result.options).toEqual({ env: 'production' });
    });

    it('throws on missing required option', () => {
      const command = cmd({
        options: [{ name: 'token', type: 'string', required: true }],
      });
      expect(() => parseCommandArgs(command, [])).toThrow('Missing required option: --token');
    });

    it('provided value overrides default', () => {
      const command = cmd({
        options: [{ name: 'env', type: 'string', default: 'production' }],
      });
      const result = parseCommandArgs(command, ['--env', 'staging']);
      expect(result.options).toEqual({ env: 'staging' });
    });
  });

  // ── Negative Numbers ──────────────────────────────────────────

  describe('negative numbers', () => {
    it('treats -5 as a positional, not a flag', () => {
      const command = cmd({
        positionalArgs: [{ name: 'offset', type: 'number' }],
      });
      const result = parseCommandArgs(command, ['-5']);
      expect(result.positionalArgs).toEqual({ offset: -5 });
    });
  });

  // ── No Arguments ──────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty results for command with no args definition', () => {
      const command = cmd();
      const result = parseCommandArgs(command, []);
      expect(result.positionalArgs).toEqual({});
      expect(result.options).toEqual({});
    });

    it('handles option resolved by alias in optionByName', () => {
      const command = cmd({
        options: [{ name: 'output', type: 'string', aliases: ['o'] }],
      });
      const result = parseCommandArgs(command, ['--output', 'dist']);
      expect(result.options).toEqual({ output: 'dist' });
    });
  });
});
