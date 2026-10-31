import type { StatsResult } from './types';

export const HIGHLIGHT_IDS = [
  'starts',
  'fastest',
  'longestWait',
  'lastWord',
  'doubleTexter',
  'talker',
  'essays',
  'voice',
  'stickers',
  'nightOwl',
  'laughs',
  'questions',
  'shouting',
] as const;

export type HighlightId = (typeof HIGHLIGHT_IDS)[number];

export type Highlight = {
  id: HighlightId;
  winner: number;
  runnerUp: number;
  winnerValue: number;
  runnerUpValue: number;
  lead: number;
};

type Metric = {
  id: HighlightId;
  values: (number | null)[];
  lowerWins?: boolean;
  minTotal?: number;
};

const MIN_TOTAL = 5;
const MIN_RESPONSES = 5;
export const MAX_HIGHLIGHTS = 6;

function metrics(stats: StatsResult): Metric[] {
  const { overview, conversations, responses, bursts, media, activity, words } = stats;
  return [
    { id: 'starts', values: conversations.started },
    {
      id: 'fastest',
      lowerWins: true,
      minTotal: 0,
      values: responses.map(({ count, medianMs }) => (count >= MIN_RESPONSES ? medianMs : null)),
    },
    {
      id: 'longestWait',
      minTotal: 0,
      values: responses.map(({ count, longest }) =>
        count >= MIN_RESPONSES ? (longest?.ms ?? null) : null,
      ),
    },
    { id: 'lastWord', values: conversations.ended },
    { id: 'doubleTexter', values: bursts.map(({ double, triple }) => double + triple) },
    { id: 'talker', values: overview.perPerson.map(({ messages }) => messages) },
    { id: 'essays', minTotal: 0, values: overview.perPerson.map(({ avgLength }) => avgLength) },
    { id: 'voice', minTotal: 0, values: media.map(({ voiceSec }) => voiceSec) },
    { id: 'stickers', values: media.map(({ kinds }) => kinds.sticker) },
    { id: 'nightOwl', values: activity.perPerson.map(({ partsOfDay }) => partsOfDay[0]) },
    { id: 'laughs', values: words.map(({ laughs }) => laughs) },
    { id: 'questions', values: words.map(({ questions }) => questions) },
    { id: 'shouting', values: words.map(({ upperMessages }) => upperMessages) },
  ];
}

export function buildHighlights(stats: StatsResult, limit = MAX_HIGHLIGHTS): Highlight[] {
  const active = stats.overview.perPerson.flatMap(({ messages }, person) =>
    messages > 0 ? [person] : [],
  );
  if (active.length < 2) return [];

  const highlights = metrics(stats).flatMap(({ id, values, lowerWins, minTotal }): Highlight[] => {
    const ranked = active
      .flatMap((person) => {
        const value = values[person];
        return value === null ? [] : [{ person, value }];
      })
      .sort((a, b) => (lowerWins ? a.value - b.value : b.value - a.value));
    if (ranked.length < 2) return [];

    const [first, second] = ranked;
    const total = ranked.reduce((sum, { value }) => sum + value, 0);
    const high = Math.max(first.value, second.value);
    if (first.value === second.value || total < (minTotal ?? MIN_TOTAL) || high === 0) return [];

    return [
      {
        id,
        winner: first.person,
        runnerUp: second.person,
        winnerValue: first.value,
        runnerUpValue: second.value,
        lead: Math.abs(first.value - second.value) / high,
      },
    ];
  });

  return highlights.sort((a, b) => b.lead - a.lead).slice(0, limit);
}
