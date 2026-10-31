import { Box, Stack, Typography } from '@mui/material';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import { buildHighlights } from '~/lib/stats/highlights';
import type { HighlightId } from '~/lib/stats/highlights';
import type { StatsResult } from '~/lib/stats/types';
import { duration, number } from './format';
import { Section, Subheading, Tile, Tiles } from './parts';
import { usePersonColors } from './personColors';

const DURATION_IDS: HighlightId[] = ['fastest', 'longestWait'];

function display(id: HighlightId, value: number): string {
  if (DURATION_IDS.includes(id)) return duration(value);
  if (id === 'voice') return `${(value / 60).toFixed(1)} min`;
  return number(value);
}

type Favorite = { person: number; key: string; count: number };

type FavoritesProps = {
  title: string;
  items: (Favorite & { name: string })[];
  testId: string;
};

function Favorites({ title, items, testId }: FavoritesProps) {
  if (items.length === 0) return null;
  return (
    <div data-testid={testId}>
      <Subheading>{title}</Subheading>
      <Box sx={{ mt: 1 }}>
        <Tiles>
          {items.map(({ person, key, count, name }) => (
            <Tile key={person} label={`${name} · ${number(count)}`} value={key} />
          ))}
        </Tiles>
      </Box>
    </div>
  );
}

export default function Highlights({ stats }: { stats: StatsResult }) {
  const t = useMessages(messages).highlights;
  const { colors } = usePersonColors();
  const highlights = buildHighlights(stats);
  const favorites = (field: 'words' | 'pairs' | 'triples' | 'emojis' | 'faces' | 'shouted') =>
    stats.words.flatMap((person, index) =>
      person[field][0]
        ? [{ person: index, name: stats.people[index].name, ...person[field][0] }]
        : [],
    );
  if (highlights.length === 0) return null;

  return (
    <Section title={t.title}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {highlights.map(({ id, winner, runnerUp, winnerValue, runnerUpValue }) => {
          const total = winnerValue + runnerUpValue;
          const share = id === 'fastest' ? runnerUpValue / total : winnerValue / total;
          return (
            <Stack
              key={id}
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 1.25,
                border: 1,
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                {t.titles[id]}
              </Typography>
              <Typography variant="h5" component="p" sx={{ overflowWrap: 'anywhere' }}>
                {stats.people[winner].name}
              </Typography>
              <Box
                role="presentation"
                sx={{ height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'divider' }}
              >
                <Box
                  sx={{
                    height: 1,
                    width: `${share * 100}%`,
                    bgcolor: colors[winner] ?? 'primary.main',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {display(id, winnerValue)} vs {display(id, runnerUpValue)} (
                {stats.people[runnerUp].name})
              </Typography>
            </Stack>
          );
        })}
      </Box>
      <Favorites title={t.favoriteWord} items={favorites('words')} testId="favorite-words" />
      <Favorites title={t.favoritePair} items={favorites('pairs')} testId="favorite-pairs" />
      <Favorites title={t.favoriteTriple} items={favorites('triples')} testId="favorite-triples" />
      <Favorites title={t.favoriteEmoji} items={favorites('emojis')} testId="favorite-emojis" />
      <Favorites title={t.favoriteFace} items={favorites('faces')} testId="favorite-faces" />
      <Favorites title={t.favoriteShout} items={favorites('shouted')} testId="favorite-shouts" />
    </Section>
  );
}
