import { describe, it, expect } from 'vitest';
import { isValidSlug } from '../lib/blog';

describe('isValidSlug', () => {
  it('accepts simple kebab-case slugs', () => {
    expect(isValidSlug('in-defense-of-bubbles')).toBe(true);
    expect(isValidSlug('build-things-that-matter')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
    expect(isValidSlug('abc123')).toBe(true);
  });

  it('rejects path-traversal and separator characters', () => {
    expect(isValidSlug('..')).toBe(false);
    expect(isValidSlug('../etc/passwd')).toBe(false);
    expect(isValidSlug('foo/bar')).toBe(false);
    expect(isValidSlug('foo\\bar')).toBe(false);
  });

  it('rejects uppercase and non-hyphen whitespace', () => {
    expect(isValidSlug('HELLO')).toBe(false);
    expect(isValidSlug('hello world')).toBe(false);
    expect(isValidSlug('hello_world')).toBe(false);
  });

  it('rejects empty and overlong inputs', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('a'.repeat(65))).toBe(false);
  });
});
