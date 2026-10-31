import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { generateChat } from '~/fixtures/generate';
import { buildColumns } from '~/lib/stats/columns';
import { computeStats } from '~/lib/stats/engine';
import type { LoadedChat } from '~/components/useChatSession';
import { dayLevel, yearSpan } from './CalendarHeatmap';
import { duration, sortByMax } from './format';
import { dominantCell, hourHeatmap, mixColors } from './charts';
import MediaRanking from './MediaRanking';
import type { CountRow } from './format';
import { PersonTable, leaderOf } from './parts';
import StatsPage, { toFilter } from './StatsPage';
import StatsView from './StatsView';

vi.mock('./Chart', () => ({
  default: ({ label }: { label: string }) => <div role="img" aria-label={label} />,
  useChartTheme: () => ({
    series: ['#111111', '#222222'],
    other: '#333333',
    sequential: ['#000000', '#ffffff'],
    levels: ['#111111', '#222222', '#333333', '#444444'],
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
      'Stickers and GIFs',
      'Calls',
      'Activity',
      'Words and emoji',
    ]) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(4);
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

describe('person colors', () => {
  it('defaults to the palette and accepts a custom color', () => {
    render(<StatsPage chat={chat} stats={stats} onCompute={vi.fn()} />);
    const [swatch] = screen.getAllByLabelText('Color for Ana Prueba');
    expect(swatch).toHaveValue('#222222');
    fireEvent.change(swatch, { target: { value: '#ff00aa' } });
    expect(screen.getAllByLabelText('Color for Ana Prueba')[0]).toHaveValue('#ff00aa');
  });
});

describe('calendar helpers', () => {
  it('spans only the months with data', () => {
    const span = yearSpan(['2026-10-01', '2026-10-30']);
    expect(new Date(span.start).toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(new Date(span.end).toISOString().slice(0, 10)).toBe('2026-10-31');
    expect(new Date(span.gridStart).getUTCDay()).toBe(1);
    expect(span.weeks).toBe(5);
  });

  it('maps counts to four levels', () => {
    expect([0, 1, 26, 51, 100].map((count) => dayLevel(count, 100))).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('most replied messages', () => {
  const reply = { ts: Date.UTC(2026, 9, 1), author: 0, preview: '', count: 4 };
  const withTop = (top: (typeof reply & { kind?: 'text' | 'photo' })[]) => ({
    ...stats,
    replies: { ...stats.replies, top },
  });

  it('does not call stripped text media', () => {
    render(<StatsView stats={withTop([{ ...reply, kind: 'text' }])} timeZone="UTC" />);
    expect(screen.getByText(/4 ×/)).not.toHaveTextContent('[media]');
  });

  it('labels real media', () => {
    render(<StatsView stats={withTop([{ ...reply, kind: 'photo' }])} timeZone="UTC" />);
    expect(screen.getByText(/4 ×/)).toHaveTextContent('[media]');
  });

  it('hides messages with too few replies', () => {
    render(<StatsView stats={withTop([{ ...reply, count: 2 }])} timeZone="UTC" />);
    expect(screen.queryByText('Most replied-to messages')).not.toBeInTheDocument();
  });
});

describe('single month chats', () => {
  const single = computeStats(buildColumns(generateChat(50)), {
    gapMs: 3_600_000,
    timeZone: 'UTC',
  });
  const multi = computeStats(buildColumns(generateChat(20_000)), {
    gapMs: 3_600_000,
    timeZone: 'UTC',
  });

  it('hides the monthly chart and the period picker', () => {
    render(<StatsView stats={single} timeZone="UTC" />);
    expect(single.activity.months).toHaveLength(1);
    expect(screen.queryByText('Monthly average')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Timeline')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Per week' })).toBeInTheDocument();
  });

  it('keeps them with several months', () => {
    render(<StatsView stats={multi} timeZone="UTC" />);
    expect(screen.getByText('Monthly average')).toBeInTheDocument();
    expect(screen.getByLabelText('Timeline')).toBeInTheDocument();
  });
});

describe('leaderOf', () => {
  it('finds the single highest value', () => {
    expect(leaderOf([990, 673])).toBe(0);
    expect(leaderOf([3, null, 8])).toBe(2);
    expect(leaderOf([990, 0])).toBe(0);
  });

  it('finds the lowest value when lower wins', () => {
    expect(leaderOf([29, 59], true)).toBe(0);
    expect(leaderOf([18, 17], true)).toBe(1);
    expect(leaderOf([null, 59], true)).toBeNull();
    expect(leaderOf([5, 5], true)).toBeNull();
  });

  it('highlights nobody on ties or zeros', () => {
    expect(leaderOf([5, 5])).toBeNull();
    expect(leaderOf([0, 0])).toBeNull();
    expect(leaderOf([null, null])).toBeNull();
  });
});

describe('PersonTable', () => {
  it('marks only the leader of ranked rows', () => {
    render(
      <PersonTable
        names={['Ana', 'Beto']}
        rows={[
          ['Ranked', (p) => String([9, 4][p]), (p) => [9, 4][p]],
          ['Plain', (p) => String([1, 2][p])],
        ]}
      />,
    );
    expect(screen.getByText('9')).toHaveAttribute('data-leader');
    expect(screen.getByText('4')).not.toHaveAttribute('data-leader');
    expect(screen.getByText('2')).not.toHaveAttribute('data-leader');
  });
});

describe('MediaRanking', () => {
  const key = 'video_files/some_long_animation.gif.mp4';
  const base = { signature: [null, null], asReplyTo: [null, null] };

  it('shows a labelled tile and a hint instead of the file name', () => {
    render(
      <MediaRanking
        names={['Ana', 'Beto']}
        media={{ ratio: 1, thumbs: {} }}
        stickers={{
          ...base,
          overall: [{ key, count: 1 }],
          perPerson: [[{ key, count: 1 }], []],
        }}
      />,
    );
    expect(screen.getByText('GIF')).toBeInTheDocument();
    expect(screen.queryByText(/some_long/)).not.toBeInTheDocument();
    expect(screen.getByText(/Choose the export folder/)).toBeInTheDocument();
  });

  it('hides the hint when the export folder gave previews', () => {
    render(
      <MediaRanking
        names={['Ana', 'Beto']}
        media={{ ratio: 1, thumbs: { 'stickers/a.webp': 'blob:a' } }}
        stickers={{
          ...base,
          overall: [
            { key: 'stickers/a.webp', count: 2 },
            { key: 'stickers/b.tgs', count: 1 },
          ],
          perPerson: [[{ key: 'stickers/a.webp', count: 2 }], []],
        }}
      />,
    );
    expect(screen.queryByText(/export folder/)).not.toBeInTheDocument();
  });

  it('shows a saved GIF preview as an image', () => {
    const { container } = render(
      <MediaRanking
        names={['Ana', 'Beto']}
        media={{ ratio: 0, thumbs: { [key]: 'data:image/webp;base64,AAAA' } }}
        stickers={{ ...base, overall: [{ key, count: 1 }], perPerson: [[], []] }}
      />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/webp;base64,AAAA');
    expect(container.querySelector('video')).toBeNull();
  });

  it('skips the per person list when only one person used them', () => {
    render(
      <MediaRanking
        names={['Ana', 'Beto']}
        stickers={{
          ...base,
          overall: [{ key: '😎', count: 3 }],
          perPerson: [[{ key: '😎', count: 3 }], []],
        }}
      />,
    );
    expect(screen.getByText('😎')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ana' })).not.toBeInTheDocument();
  });

  it('shows emoji stickers without a preview hint', () => {
    render(
      <MediaRanking
        names={['Ana', 'Beto']}
        media={{ ratio: 1, thumbs: {} }}
        stickers={{
          ...base,
          overall: [{ key: '😎', count: 3 }],
          perPerson: [[{ key: '😎', count: 2 }], [{ key: '😎', count: 1 }]],
        }}
      />,
    );
    expect(screen.queryByText(/export folder/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
  });
});

describe('dominant heatmap', () => {
  it('finds the person who wrote the most in a cell', () => {
    expect(dominantCell([3, 9])).toBe(1);
    expect(dominantCell([4, 4])).toBeNull();
    expect(dominantCell([0, 0])).toBeNull();
  });

  it('mixes colors between two hex values', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColors('#102030', '#102030', 0.7)).toBe('#102030');
  });
});

describe('hourHeatmap', () => {
  const theme = {
    series: [],
    other: '#333333',
    sequential: ['#000000', '#111111', '#ffffff'],
    levels: [],
    text: '#000000',
    grid: '#000000',
  };
  const ramp = (color?: string) =>
    (
      hourHeatmap(new Array(168).fill(1), [], [], theme, color).visualMap as {
        inRange: { color: string[] };
      }
    ).inRange.color;

  it('uses the shared ramp for everyone', () => {
    expect(ramp()).toEqual(theme.sequential);
  });

  it('uses the color of the selected person', () => {
    expect(ramp('#d95926')).toEqual(['#000000', '#d95926']);
  });
});

describe('favorites in highlights', () => {
  it('shows the top word and emoji of each person', () => {
    render(<StatsPage chat={chat} stats={stats} onCompute={vi.fn()} />);
    expect(within(screen.getByTestId('favorite-words')).getAllByText(/ · /)).toHaveLength(2);
    const emojis = within(screen.getByTestId('favorite-emojis'));
    expect(emojis.getByText('Most used emoji')).toBeInTheDocument();
    expect(emojis.getAllByText('😂').length).toBeGreaterThan(0);
  });
});

describe('chosen colors', () => {
  it('starts from the colors picked before the stats', () => {
    render(<StatsView stats={stats} timeZone="UTC" chosenColors={{ ana: '#ff00aa' }} />);
    expect(screen.getAllByLabelText('Color for Ana Prueba')[0]).toHaveValue('#ff00aa');
    expect(screen.getAllByLabelText('Color for Beto Demo')[0]).toHaveValue('#111111');
  });
});

describe('export results', () => {
  it('opens the dialog with quotes off by default', async () => {
    render(<StatsPage chat={chat} stats={stats} onCompute={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export results' }));
    expect(
      await screen.findByRole('checkbox', { name: 'Include message quotes' }),
    ).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Create PDF' })).toBeInTheDocument();
  });

  it('hides quotes in the exported view', () => {
    render(<StatsView stats={stats} timeZone="UTC" hideQuotes />);
    expect(screen.queryByText(/, shortest/)).not.toBeInTheDocument();
    expect(screen.queryByText(/, longest/)).not.toBeInTheDocument();
  });
});

describe('sortByMax', () => {
  it('orders by the highest value of any person and keeps ties stable', () => {
    const rows: CountRow[] = [
      ['none', () => 0],
      ['videos', (person) => [3, 0][person]],
      ['links', (person) => [6, 28][person]],
      ['photos', (person) => [72, 3][person]],
      ['polls', () => 0],
    ];
    expect(sortByMax(rows, 2).map(([label]) => label)).toEqual([
      'photos',
      'links',
      'videos',
      'none',
      'polls',
    ]);
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
