import { Alert, Box, Button, LinearProgress, Stack } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { LoadedChat, MediaState } from '~/components/useChatSession';
import { saveStats } from '~/lib/saved';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import type { Filter, StatsResult } from '~/lib/stats/types';
import { DEFAULT_TIME_ZONE, wallTimeToTs } from '~/lib/time';
import ExportDialog from './ExportDialog';
import FilterBar from './FilterBar';
import type { Controls } from './FilterBar';
import StatsView from './StatsView';

const DEBOUNCE_MS = 150;
const EXPORT_WIDTH = 430;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const YEAR_MS = 365 * DAY_MS;

const INITIAL: Controls = {
  preset: 'all',
  fromDate: '',
  toDate: '',
  person: '',
  gapHours: 6,
  timeZone: DEFAULT_TIME_ZONE,
  phrase: '',
  personZones: {},
};

export function toFilter(controls: Controls, lastTs: number | null): Filter {
  const { preset, fromDate, toDate, timeZone } = controls;
  const dayStart = (value: string) => wallTimeToTs(Date.parse(value), timeZone);
  const filter: Filter = {
    gapMs: controls.gapHours * HOUR_MS,
    timeZone,
    participantTimeZones: controls.personZones,
  };
  if (preset === 'year' && lastTs !== null) filter.from = lastTs - YEAR_MS;
  if (preset === 'custom' && fromDate) filter.from = dayStart(fromDate);
  if (preset === 'custom' && toDate) filter.to = dayStart(toDate) + DAY_MS;
  if (controls.person !== '') filter.person = Number(controls.person);
  if (controls.phrase) filter.phrase = controls.phrase;
  return filter;
}

type Props = {
  chat: LoadedChat;
  stats: StatsResult | null;
  media?: MediaState;
  onCompute: (filter: Filter) => void;
};

export default function StatsPage({ chat, stats, media, onCompute }: Props) {
  const t = useMessages(messages);
  const [controls, setControls] = useState(INITIAL);
  const [savedOk, setSavedOk] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportView, setExportView] = useState<{ quotes: boolean } | null>(null);
  const exportTarget = useRef<HTMLDivElement | null>(null);
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    if (lastTs.current === null && stats) lastTs.current = stats.overview.lastTs;
  }, [stats]);

  useEffect(() => {
    const timer = setTimeout(() => onCompute(toFilter(controls, lastTs.current)), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [controls, onCompute]);

  if (!stats) return <LinearProgress />;

  return (
    <Stack spacing={2}>
      <FilterBar people={stats.people} controls={controls} onChange={setControls} />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            void saveStats({
              name: chat.name,
              savedAt: Date.now(),
              timeZone: controls.timeZone,
              stats,
            }).then(() => setSavedOk(true));
          }}
        >
          {t.save.action}
        </Button>
        <Button variant="contained" size="small" onClick={() => setExportOpen(true)}>
          {t.exportPdf.action}
        </Button>
        {savedOk && <Alert severity="success">{t.save.done}</Alert>}
      </Stack>
      <Box
        ref={exportTarget}
        sx={
          exportView
            ? {
                width: EXPORT_WIDTH,
                alignSelf: 'center',
                p: 1.5,
                bgcolor: 'background.default',
                '& [data-export-hide]': { display: 'none' },
                '& [data-table-scroll]': { overflow: 'visible' },
                '& td, & th': { px: 0.75, whiteSpace: 'normal' },
              }
            : undefined
        }
      >
        <StatsView
          stats={stats}
          timeZone={controls.timeZone}
          media={media}
          chosenColors={chat.colors}
          hideQuotes={exportView !== null && !exportView.quotes}
        />
      </Box>
      <ExportDialog
        open={exportOpen}
        target={exportTarget}
        onClose={() => setExportOpen(false)}
        onPrepare={(quotes) => setExportView({ quotes })}
        onFinish={() => setExportView(null)}
      />
    </Stack>
  );
}
