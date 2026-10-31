import { describe, expect, it, vi } from 'vitest';
import { applyCanonicalMedia, canonicalMedia, matchMediaPath, sha256, topMediaKeys } from './media';
import type { MediaSource } from './media';

const source = (name: string, values: number[]): MediaSource => ({
  name,
  size: values.length,
  read: vi.fn(async () => Uint8Array.from(values)),
});

describe('canonicalMedia', () => {
  it('hashes only files that share a size and merges identical ones', async () => {
    const unique = source('unique.webp', [1, 2, 3]);
    const sources = [
      unique,
      source('a.webp', [1, 1]),
      source('b.webp', [1, 1]),
      source('c.webp', [2, 2]),
    ];
    const canonical = await canonicalMedia(sources, sha256);
    expect([...canonical]).toEqual([['b.webp', 'a.webp']]);
    expect(unique.read).not.toHaveBeenCalled();
    expect(applyCanonicalMedia(['a.webp', 'b.webp'], canonical)).toEqual(['a.webp', 'a.webp']);
  });
});

describe('topMediaKeys', () => {
  it('ranks by use after merging keys', () => {
    expect(topMediaKeys(Int32Array.from([-1, 0, 1, 2, 2]), ['a', 'a', 'b'], 1)).toEqual(['a']);
  });
});

describe('matchMediaPath', () => {
  it('ignores the leading export folder', () => {
    const wanted = new Set(['stickers/one.webp']);
    expect(matchMediaPath('ChatExport_2026/stickers/one.webp', wanted)).toBe('stickers/one.webp');
    expect(matchMediaPath('ChatExport_2026/photos/one.webp', wanted)).toBeNull();
  });
});
