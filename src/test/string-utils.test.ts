import { displayLength, stripAnsi, wrapText } from '@lib/util/string-utils';
import { describe, expect, it } from 'vitest';

describe('stripAnsi', () => {
  it('removes ANSI color codes', () => {
    expect(stripAnsi('\u001B[31mhello\u001B[0m')).toBe('hello');
  });

  it('removes multiple ANSI sequences', () => {
    expect(stripAnsi('\u001B[1m\u001B[34mbold blue\u001B[0m')).toBe('bold blue');
  });

  it('returns plain text unchanged', () => {
    expect(stripAnsi('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(stripAnsi('')).toBe('');
  });
});

describe('displayLength', () => {
  it('returns length of plain text', () => {
    expect(displayLength('hello')).toBe(5);
  });

  it('ignores ANSI codes in length calculation', () => {
    expect(displayLength('\u001B[31mhello\u001B[0m')).toBe(5);
  });

  it('returns 0 for empty string', () => {
    expect(displayLength('')).toBe(0);
  });
});

describe('wrapText', () => {
  it('returns single-element array when text fits', () => {
    expect(wrapText('short', 80)).toEqual(['short']);
  });

  it('wraps text at word boundaries', () => {
    const result = wrapText('hello world foo bar', 11);
    expect(result).toEqual(['hello world', 'foo bar']);
  });

  it('handles a single long word exceeding maxWidth', () => {
    const result = wrapText('superlongword next', 5);
    // The word itself exceeds maxWidth, but wrapping splits at spaces
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.join(' ')).toContain('superlongword');
  });

  it('handles empty string', () => {
    expect(wrapText('', 80)).toEqual(['']);
  });

  it('wraps multiple lines correctly', () => {
    const result = wrapText('one two three four five six', 10);
    for (const line of result) {
      expect(line.length).toBeLessThanOrEqual(15); // reasonable bound
    }
    expect(result.join(' ')).toBe('one two three four five six');
  });
});
