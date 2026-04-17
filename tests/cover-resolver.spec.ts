import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveSongPathFromDir } from '../app/api/songs/cover/route';

// Synthetic absolute path used purely as a string argument to the pure
// resolveSongPathFromDir function below; no real filesystem access occurs
// in this test, so we intentionally avoid /tmp (Sonar S5443).
const dir = path.resolve(process.cwd(), 'fixtures', 'songs');

describe('resolveSongPathFromDir', () => {
  it('accepts a normal .mp3 name', () => {
    const resolved = resolveSongPathFromDir(dir, 'song.mp3');
    expect(resolved).toBe(path.join(dir, 'song.mp3'));
  });

  it('accepts names containing spaces', () => {
    const resolved = resolveSongPathFromDir(dir, 'some song.mp3');
    expect(resolved).toBe(path.join(dir, 'some song.mp3'));
  });

  it('rejects traversal via ..', () => {
    expect(resolveSongPathFromDir(dir, '../package.json')).toBeNull();
    expect(resolveSongPathFromDir(dir, '../../etc/passwd.mp3')).toBeNull();
  });

  it('rejects absolute paths', () => {
    expect(resolveSongPathFromDir(dir, '/etc/passwd.mp3')).toBeNull();
  });

  it('rejects non-mp3 extensions', () => {
    expect(resolveSongPathFromDir(dir, 'song.exe')).toBeNull();
    expect(resolveSongPathFromDir(dir, 'song')).toBeNull();
    expect(resolveSongPathFromDir(dir, '')).toBeNull();
  });

  it('rejects slashes inside the name', () => {
    expect(resolveSongPathFromDir(dir, 'sub/song.mp3')).toBeNull();
  });
});
