import { describe, expect, it } from 'vitest';
import { fitSize } from './thumbnails';

describe('fitSize', () => {
  it('shrinks the longest side to the limit and keeps the shape', () => {
    expect(fitSize(960, 480, 96)).toEqual({ width: 96, height: 48 });
    expect(fitSize(480, 960, 96)).toEqual({ width: 48, height: 96 });
  });

  it('never enlarges small images', () => {
    expect(fitSize(40, 20, 96)).toEqual({ width: 40, height: 20 });
  });

  it('keeps at least one pixel', () => {
    expect(fitSize(10_000, 1, 96)).toEqual({ width: 96, height: 1 });
  });
});
