import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { generateChat } from '~/fixtures/generate';
import { buildColumns } from '~/lib/stats/columns';
import { computeStats } from '~/lib/stats/engine';
import type { LoadedChat } from '~/components/useChatSession';
import { duration } from './format';
import StatsPage, { toFilter } from './StatsPage';

vi.mock('./Chart', () => ({
  default: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
  useChartTheme: () => ({
    series: ['#111111', '#222222'],
    other: '#333333',
    sequential: ['#000000', '#ffffff'],
    text: '#000000',
    grid: '#000000',
  }),
}));

const stats = computeStats(buildColumns(generateChat(500)), {
  gapMs: 6 * 3_600_000,
  timeZone: 'UTC',
});
const chat = { name: 'Generated' } as LoadedChat;

describe('StatsPage', () => {
  it('renders every section with real stats', () => {
    render(<StatsPage chat={chat} stats={stats} onCompute={vi.fn()} />);
    for (const title of [
      'Overview',
      'Conversations',
      'Response times',
      'Media and message types',
      'Calls',
      'Activity',
      'Words and emoji',
    ]) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(6);
    const overview = screen.getByRole('region', { name: 'Overview' });
    expect(within(overview).getAllByText('500').length).toBeGreaterThan(0);
  });

  it('debounces the first compute', () => {
    vi.useFakeTimers();
    const onCompute = vi.fn();
    render(<StatsPage chat={chat} stats={null} onCompute={onCompute} />);
    expect(onCompute).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    vi.useRealTimers();
    expect(onCompute).toHaveBeenCalledTimes(1);
  });
});

describe('toFilter', () => {
  const controls = {
    preset: 'custom' as const,
    fromDate: '2026-01-15',
    toDate: '2026-01-15',
    person: '1',
    gapHours: 2,
    timeZone: 'America/Santiago',
    phrase: 'hola',
    personZones: {},
  };

  it('uses local day bounds, inclusive of the end date', () => {
    const filter = toFilter(controls, null);
    expect(filter.from).toBe(Date.UTC(2026, 0, 15, 3));
    expect(filter.to).toBe(Date.UTC(2026, 0, 16, 3));
    expect(filter.person).toBe(1);
    expect(filter.gapMs).toBe(2 * 3_600_000);
  });

  it('computes last year from the last message', () => {
    const filter = toFilter({ ...controls, preset: 'year' }, 400 * 86_400_000);
    expect(filter.from).toBe(35 * 86_400_000);
  });
});

describe('duration', () => {
  it.each([
    [null, '–'],
    [5_000, '5 s'],
    [125_000, '2 min 5 s'],
    [3_660_000, '1 h 1 min'],
    [90_000_000, '25 h 0 min'],
    [180_000_000, '2 d 2 h'],
  ])('%s', (ms, text) => {
    expect(duration(ms)).toBe(text);
  });
});
