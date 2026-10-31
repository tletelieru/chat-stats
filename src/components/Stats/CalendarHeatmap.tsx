import { Box, Stack, Typography } from '@mui/material';
import { messages } from '~/i18n/messages';
import { useLocale, useMessages } from '~/i18n/react';
import type { DayCount } from '~/lib/stats/types';
import { useChartTheme } from './Chart';

const DAY_MS = 86_400_000;
const GAP = 3;
const LABELLED_WEEKDAYS = [0, 2, 4];

const toDay = (ts: number) => new Date(ts).toISOString().slice(0, 10);

function cellSize(weeks: number): number {
  if (weeks <= 10) return 30;
  if (weeks <= 27) return 22;
  return 15;
}

export function dayLevel(count: number, max: number): number {
  return count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4));
}

export function yearSpan(days: string[]) {
  const first = new Date(`${days[0]}T00:00:00Z`);
  const last = new Date(`${days[days.length - 1]}T00:00:00Z`);
  const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 0);
  const gridStart = start - ((new Date(start).getUTCDay() + 6) % 7) * DAY_MS;
  return { start, end, gridStart, weeks: Math.ceil((end - gridStart + DAY_MS) / (7 * DAY_MS)) };
}

type Props = {
  days: DayCount[];
  selected: string | null;
  onSelect: (day: string) => void;
};

export default function CalendarHeatmap({ days, selected, onSelect }: Props) {
  const t = useMessages(messages);
  const locale = useLocale();
  const { levels } = useChartTheme();
  const counts = new Map(days.map(({ day, total }) => [day, total]));
  const max = Math.max(1, ...days.map(({ total }) => total));
  const years = [...new Set(days.map(({ day }) => day.slice(0, 4)))];
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const mondayFirst = [...t.weekdays.slice(1), t.weekdays[0]];

  return (
    <Stack spacing={2}>
      {years.map((year) => {
        const active = days.filter(({ day }) => day.startsWith(year)).map(({ day }) => day);
        const { start, end, gridStart, weeks } = yearSpan(active);
        const size = cellSize(weeks);
        const cells = Array.from({ length: weeks * 7 }, (_, index) => gridStart + index * DAY_MS);
        const months = cells.filter(
          (ts) => ts >= start && ts <= end && new Date(ts).getUTCDate() === 1,
        );

        return (
          <Box key={year} sx={{ overflowX: 'auto', pb: 0.5 }}>
            {years.length > 1 && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {year}
              </Typography>
            )}
            <Box
              sx={{
                display: 'inline-grid',
                gap: `${GAP}px`,
                alignItems: 'center',
                gridTemplateColumns: `auto repeat(${weeks}, ${size}px)`,
                gridTemplateRows: `auto repeat(7, ${size}px)`,
              }}
            >
              {months.map((ts) => (
                <Typography
                  key={ts}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    gridRow: 1,
                    gridColumn: `${Math.floor((ts - gridStart) / (7 * DAY_MS)) + 2} / span 3`,
                  }}
                >
                  {month.format(ts)}
                </Typography>
              ))}
              {LABELLED_WEEKDAYS.map((row) => (
                <Typography
                  key={row}
                  variant="caption"
                  color="text.secondary"
                  sx={{ gridColumn: 1, gridRow: row + 2, pr: 0.75, lineHeight: 1 }}
                >
                  {mondayFirst[row]}
                </Typography>
              ))}
              {cells.map((ts, index) => {
                if (ts < start || ts > end) return null;
                const day = toDay(ts);
                const count = counts.get(day) ?? 0;
                const label = `${day}: ${count.toLocaleString()}`;
                return (
                  <Box
                    key={day}
                    component="button"
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={selected === day}
                    disabled={count === 0}
                    onClick={() => onSelect(day)}
                    sx={{
                      gridColumn: Math.floor(index / 7) + 2,
                      gridRow: (index % 7) + 2,
                      width: size,
                      height: size,
                      p: 0,
                      border: 0,
                      borderRadius: '4px',
                      cursor: count ? 'pointer' : 'default',
                      bgcolor: count ? levels[dayLevel(count, max) - 1] : 'action.hover',
                      outline: selected === day ? 2 : 0,
                      outlineStyle: 'solid',
                      outlineColor: 'text.primary',
                      outlineOffset: 1,
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        );
      })}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ pr: 0.5 }}>
          {t.stats.less}
        </Typography>
        <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: 'action.hover' }} />
        {levels.map((color) => (
          <Box key={color} sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: color }} />
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
          {t.stats.more}
        </Typography>
      </Stack>
    </Stack>
  );
}
