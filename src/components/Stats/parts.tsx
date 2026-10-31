import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import type { Ranked } from '~/lib/stats/types';
import { PersonSwatch, usePersonColors } from './personColors';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" component="section" aria-label={title}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Stack spacing={2.5}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

export function Subheading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle2" component="h3">
      {children}
    </Typography>
  );
}

export function Tiles({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      }}
    >
      {children}
    </Box>
  );
}

export function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: 1.25, bgcolor: 'action.hover' }}>
      <Typography variant="h5" component="p" sx={{ overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export type Row = [
  label: string,
  values: (person: number) => string,
  rank?: (person: number) => number | null,
  lowerWins?: boolean,
];

export function leaderOf(values: (number | null)[], lowerWins = false): number | null {
  const present = values.flatMap((value) => (value === null ? [] : [value]));
  if (present.length < 2) return null;
  const best = lowerWins ? Math.min(...present) : Math.max(...present);
  if (Math.max(...present) === 0 || present.filter((value) => value === best).length > 1) {
    return null;
  }
  return values.indexOf(best);
}

function ValueChip({ person, text, leader }: { person: number; text: string; leader: boolean }) {
  const { palette } = useTheme();
  const { colors } = usePersonColors();
  const color = colors[person] ?? palette.primary.main;

  return (
    <Box
      component="span"
      data-leader={leader || undefined}
      sx={{
        display: 'inline-block',
        px: 1.25,
        py: 0.25,
        borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: leader ? 700 : 400,
        whiteSpace: 'nowrap',
        color: leader ? palette.getContrastText(color) : 'text.primary',
        bgcolor: leader ? color : 'action.hover',
      }}
    >
      {text}
    </Box>
  );
}

export function PersonTable({ names, rows }: { names: string[]; rows: Row[] }) {
  return (
    <Box data-table-scroll sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            {names.map((name, person) => (
              <TableCell key={name} align="right" sx={{ fontWeight: 700 }}>
                <PersonSwatch person={person} name={name} />
                {name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, value, rank, lowerWins]) => {
            const leader = rank
              ? leaderOf(
                  names.map((_, person) => rank(person)),
                  lowerWins,
                )
              : null;
            return (
              <TableRow key={label}>
                <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>
                  {label}
                </TableCell>
                {names.map((name, person) => (
                  <TableCell key={name} align="right">
                    <ValueChip person={person} text={value(person)} leader={leader === person} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export function RankedChips({ items, emoji = false }: { items: Ranked[]; emoji?: boolean }) {
  const t = useMessages(messages);
  if (items.length === 0) return <Typography color="text.secondary">{t.stats.none}</Typography>;
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      {items.map(({ key, count }) => (
        <Chip
          key={key}
          sx={{ height: emoji ? 40 : 34, fontSize: '1rem' }}
          label={
            <>
              <Box component="span" sx={{ fontSize: emoji ? '1.5rem' : 'inherit', lineHeight: 1 }}>
                {key}
              </Box>
              {` · ${count.toLocaleString()}`}
            </>
          }
        />
      ))}
    </Stack>
  );
}
