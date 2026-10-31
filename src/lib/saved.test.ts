import { describe, expect, it } from 'vitest';
import { generateChat } from '~/fixtures/generate';
import { stripMessageText } from './saved';
import { buildColumns } from './stats/columns';
import { computeStats } from './stats/engine';

describe('stripMessageText', () => {
  it('removes every message preview from the stored stats', () => {
    const stats = computeStats(buildColumns(generateChat(300)), {
      gapMs: 3_600_000,
      timeZone: 'UTC',
    });
    const stored = JSON.stringify(stripMessageText(stats));
    expect(JSON.stringify(stats)).toMatch(/"preview":"[^"]/);
    expect(stored).not.toMatch(/"preview":"[^"]/);
  });
});
