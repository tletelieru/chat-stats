import { LinearProgress, Stack } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { LoadedChat, MediaState } from '~/components/useChatSession';
import type { Filter, StatsResult } from '~/lib/stats/types';
import { DEFAULT_TIME_ZONE, wallTimeToTs } from '~/lib/time';
import FilterBar from './FilterBar';
import type { Controls } from './FilterBar';
import StatsView from './StatsView';

const DEBOUNCE_MS = 150;
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

export default function StatsPage({ stats, media, onCompute }: Props) {
  const [controls, setControls] = useState(INITIAL);
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
      <StatsView stats={stats} timeZone={controls.timeZone} media={media} />
    </Stack>
  );
}
