import { describe, expect, it, vi } from 'vitest';
import { sliceLayout, withFallback } from './exportPdf';

describe('withFallback', () => {
  it('moves on to a lower resolution when one fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const attempt = vi.fn(async (ratio: number) => {
      if (ratio > 1.5) throw new Error('out of memory');
      return ratio;
    });
    expect(await withFallback([3, 2, 1.5], attempt)).toBe(1.5);
    expect(attempt).toHaveBeenCalledTimes(3);
    error.mockRestore();
  });

  it('reports the last error when every attempt fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(
      withFallback([3, 2], async (ratio) => {
        throw new Error(`failed ${ratio}`);
      }),
    ).rejects.toThrow('failed 2');
    error.mockRestore();
  });

  it('stops at the first success', async () => {
    const attempt = vi.fn(async (ratio: number) => ratio);
    expect(await withFallback([3, 2], attempt)).toBe(3);
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});

describe('sliceLayout', () => {
  it('covers the whole height without gaps', () => {
    const slices = sliceLayout(7000);
    expect(slices.map(({ top, height }) => [top, height])).toEqual([
      [0, 3000],
      [3000, 3000],
      [6000, 1000],
    ]);
    expect(new Set(slices.map(({ page }) => page))).toEqual(new Set([0]));
  });

  it('starts a new page past the PDF height limit', () => {
    const slices = sliceLayout(20_000);
    const last = slices[slices.length - 1];
    expect(last.page).toBe(1);
    expect(last.top - last.pageTop).toBe(0);
    expect(slices.find(({ page }) => page === 1)?.top).toBe(18_000);
  });
});
