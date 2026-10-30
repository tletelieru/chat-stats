import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import type { MediaState } from '~/components/useChatSession';
import type { MessageKind } from '~/lib/model';
import type { ResponsePair, StatsResult } from '~/lib/stats/types';
import Chart, { useChartTheme } from './Chart';
import {
  buildSeries,
  calendarHeatmap,
  groupedBars,
  hourHeatmap,
  lines,
  stackedBars,
} from './charts';
import {
  HOURS,
  PARTS_OF_DAY,
  RESPONSE_BUCKETS,
  WEEKDAYS,
  date,
  dateTime,
  duration,
  hour,
  number,
  percent,
  weekday,
} from './format';
import MediaRanking from './MediaRanking';
import { PersonTable, RankedChips, Section, Subheading, Tile } from './parts';
import type { Row } from './parts';

const MEDIA_ROWS: [string, MessageKind][] = [
  ['Photos', 'photo'],
  ['Videos', 'video'],
  ['Voice notes', 'voice'],
  ['Round video notes', 'video_note'],
  ['Audio files', 'audio'],
  ['Stickers', 'sticker'],
  ['GIFs', 'gif'],
  ['Documents', 'file'],
  ['Locations', 'location'],
  ['Polls', 'poll'],
  ['Contacts', 'contact'],
  ['Unknown media', 'unknown_media'],
];

type PairProps = {
  label: string;
  pair: ResponsePair;
  names: string[];
  timeZone: string;
};

function Pair({ label, pair, names, timeZone }: PairProps) {
  return (
    <Typography variant="body2">
      <strong>
        {label} ({duration(pair.ms)}, {dateTime(pair.answer.ts, timeZone)}):
      </strong>{' '}
      {names[pair.question.author]}: “{pair.question.preview || '[media]'}” →{' '}
      {names[pair.answer.author]}: “{pair.answer.preview || '[media]'}”
    </Typography>
  );
}

type Props = {
  stats: StatsResult;
  timeZone: string;
  media?: MediaState;
};

export default function StatsView({ stats, timeZone, media }: Props) {
  const theme = useChartTheme();
  const names = useMemo(() => stats.people.map(({ name }) => name), [stats.people]);
  const weights = stats.overview.perPerson.map(({ messages }) => messages);
  const [heatPerson, setHeatPerson] = useState('');
  const [period, setPeriod] = useState<'weeks' | 'months'>('months');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { overview, conversations, responses, activity } = stats;
  const series = (rows: (number | null)[][]) => buildSeries(names, rows, weights, theme);

  const timeline = activity[period];
  const timelineSeries = series(
    names.map((_, person) => timeline.map(({ perPerson }) => perPerson[person])),
  );

  const months = [
    ...new Set(responses.flatMap(({ monthly }) => monthly.map((m) => m.month))),
  ].sort();
  const monthlySeries = series(
    responses.map(({ monthly }) =>
      months.map((month) => monthly.find((entry) => entry.month === month)?.avgMs ?? null),
    ),
  );

  const calendar = calendarHeatmap(activity.days, theme);
  const day = activity.days.find((entry) => entry.day === selectedDay);
  const heat = heatPerson === '' ? activity.heat : activity.perPerson[Number(heatPerson)].heat;

  const conversationRows: Row[] = [
    ['Started', (p) => number(conversations.started[p])],
    ['Ended', (p) => number(conversations.ended[p])],
    ['Double texts', (p) => number(stats.bursts[p].double)],
    ['Triple texts or more', (p) => number(stats.bursts[p].triple)],
    ['Longest burst', (p) => number(stats.bursts[p].longest)],
    ['Replies used', (p) => number(stats.replies.sent[p])],
    ['Replies received', (p) => number(stats.replies.received[p])],
  ];

  const responseRows: Row[] = [
    ['Responses', (p) => number(responses[p].count)],
    ['Average', (p) => duration(responses[p].avgMs)],
    ['Median', (p) => duration(responses[p].medianMs)],
    ['p90', (p) => duration(responses[p].p90Ms)],
    ['Shortest', (p) => duration(responses[p].shortest?.ms ?? null)],
    ['Longest', (p) => duration(responses[p].longest?.ms ?? null)],
  ];

  const mediaRows: Row[] = [
    ...MEDIA_ROWS.map(([label, kind]): Row => [label, (p) => number(stats.media[p].kinds[kind])]),
    ['Links', (p) => number(stats.media[p].links)],
    ['Voice minutes', (p) => (stats.media[p].voiceSec / 60).toFixed(1)],
    [
      'Average voice length',
      (p) =>
        duration(
          stats.media[p].voiceCount
            ? (stats.media[p].voiceSec / stats.media[p].voiceCount) * 1000
            : null,
        ),
    ],
    ['Longest voice note', (p) => duration(stats.media[p].longestVoiceSec * 1000)],
    ['Edited', (p) => number(stats.flags[p].edited)],
    ['Forwarded', (p) => number(stats.flags[p].forwarded)],
    ['Deleted', (p) => number(stats.flags[p].deleted)],
  ];

  const callRows: Row[] = [
    ['Calls made', (p) => number(stats.calls[p].count)],
    ['Total time', (p) => duration(stats.calls[p].durationSec * 1000)],
    ['Missed or declined', (p) => number(stats.calls[p].missed)],
    ['Longest call', (p) => duration(stats.calls[p].longestSec * 1000)],
  ];

  const timeRows: Row[] = [
    ['Most active hour', (p) => hour(activity.perPerson[p].topHour)],
    ['Most active weekday', (p) => weekday(activity.perPerson[p].topWeekday)],
    ['Typical first hour', (p) => hour(activity.perPerson[p].earliestHour)],
    ['Typical last hour', (p) => hour(activity.perPerson[p].latestHour)],
    ...PARTS_OF_DAY.map((label, part): Row => [
      label,
      (p) => number(activity.perPerson[p].partsOfDay[part]),
    ]),
  ];

  const wordRows: Row[] = [
    ['Laughs', (p) => number(stats.words[p].laughs)],
    ['Questions', (p) => number(stats.words[p].questions)],
    ['Phrase matches', (p) => number(stats.words[p].phrase)],
    ['Reactions given', (p) => number(stats.reactions.given[p])],
  ];

  return (
    <Stack spacing={2}>
      <Section title="Overview">
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 4 }}>
          <Tile label="Messages" value={number(overview.messages)} />
          <Tile label="Words" value={number(overview.words)} />
          <Tile label="Characters" value={number(overview.chars)} />
          <Tile
            label="Days active"
            value={`${number(overview.daysActive)} / ${number(overview.daysTotal)}`}
          />
          <Tile label="First message" value={date(overview.firstTs, timeZone)} />
          <Tile label="Last message" value={date(overview.lastTs, timeZone)} />
        </Stack>
        <PersonTable
          names={names}
          rows={[
            ['Messages', (p) => number(overview.perPerson[p].messages)],
            ['Share', (p) => percent(overview.perPerson[p].share)],
            ['Words', (p) => number(overview.perPerson[p].words)],
            ['Average length', (p) => number(overview.perPerson[p].avgLength)],
          ]}
        />
      </Section>

      <Section title="Conversations">
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 4 }}>
          <Tile label="Conversations" value={number(conversations.total)} />
          <Tile label="Per week" value={conversations.perWeek.toFixed(1)} />
          <Tile
            label="Longest conversation"
            value={
              conversations.longest
                ? `${duration(conversations.longest.durationMs)}, ${number(conversations.longest.messages)} msgs`
                : '–'
            }
          />
          <Tile
            label="Longest silence"
            value={duration(conversations.longestSilence?.durationMs ?? null)}
          />
        </Stack>
        <PersonTable names={names} rows={conversationRows} />
        {stats.replies.top.length > 0 && <Subheading>Most replied-to messages</Subheading>}
        {stats.replies.top.map((message) => (
          <Typography key={`${message.ts}-${message.author}`} variant="body2">
            {message.count.toLocaleString()} × {names[message.author]}: “
            {message.preview || '[media]'}”
          </Typography>
        ))}
      </Section>

      <Section title="Response times">
        <PersonTable names={names} rows={responseRows} />
        {responses.map(({ shortest, longest }, person) => (
          <Stack key={names[person]} spacing={0.5}>
            {shortest && (
              <Pair
                label={`${names[person]}, shortest`}
                pair={shortest}
                names={names}
                timeZone={timeZone}
              />
            )}
            {longest && (
              <Pair
                label={`${names[person]}, longest`}
                pair={longest}
                names={names}
                timeZone={timeZone}
              />
            )}
          </Stack>
        ))}
        <Subheading>Distribution</Subheading>
        <Chart
          label="Response time distribution per person"
          option={groupedBars(
            RESPONSE_BUCKETS,
            series(responses.map(({ histogram }) => histogram)),
            theme,
          )}
        />
        <Subheading>Monthly average</Subheading>
        <Chart
          label="Average response time per month"
          option={lines(months, monthlySeries, theme, duration)}
        />
        <Subheading>By hour of day</Subheading>
        <Chart
          label="Average response time by hour"
          option={lines(HOURS, series(responses.map(({ byHour }) => byHour)), theme, duration)}
        />
      </Section>

      <Section title="Media and message types">
        <PersonTable names={names} rows={mediaRows} />
      </Section>

      <MediaRanking stickers={stats.stickers} names={names} media={media} />

      <Section title="Calls">
        <PersonTable names={names} rows={callRows} />
      </Section>

      <Section title="Activity">
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 4 }}>
          <Tile
            label={`Busiest day${activity.busiestDay ? ` (${activity.busiestDay.day})` : ''}`}
            value={number(activity.busiestDay?.count ?? 0)}
          />
          <Tile
            label={
              activity.longestStreak
                ? `Longest streak (from ${activity.longestStreak.from})`
                : 'Longest streak'
            }
            value={`${number(activity.longestStreak?.days ?? 0)} days`}
          />
          <Tile
            label={
              activity.longestGap ? `Longest gap (from ${activity.longestGap.from})` : 'Longest gap'
            }
            value={`${number(activity.longestGap?.days ?? 0)} days`}
          />
        </Stack>
        <Subheading>Messages per day</Subheading>
        <Chart
          label="Calendar heatmap of messages per day"
          option={calendar.option}
          height={calendar.height}
          onClick={({ data }) => setSelectedDay((data as [string, number])[0])}
        />
        {day && (
          <Typography variant="body2">
            {day.day}: {names.map((name, person) => `${name} ${day.perPerson[person]}`).join(', ')}
          </Typography>
        )}
        <TextField
          select
          size="small"
          label="Timeline"
          value={period}
          sx={{ maxWidth: 200 }}
          onChange={(event) => setPeriod(event.target.value as 'weeks' | 'months')}
        >
          <MenuItem value="months">Per month</MenuItem>
          <MenuItem value="weeks">Per week</MenuItem>
        </TextField>
        <Chart
          label="Messages over time, stacked by person"
          option={stackedBars(
            timeline.map(({ period: label }) => label),
            timelineSeries,
            theme,
          )}
        />
        <TextField
          select
          size="small"
          label="Heatmap person"
          value={heatPerson}
          sx={{ maxWidth: 200 }}
          onChange={(event) => setHeatPerson(event.target.value)}
        >
          <MenuItem value="">Everyone</MenuItem>
          {names.map((name, person) => (
            <MenuItem key={name} value={String(person)}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        <Chart
          label="Messages by hour and weekday"
          option={hourHeatmap(heat, HOURS, WEEKDAYS, theme)}
          height={300}
        />
        <PersonTable names={names} rows={timeRows} />
      </Section>

      <Section title="Words and emoji">
        <PersonTable names={names} rows={wordRows} />
        {stats.reactions.top.length > 0 && (
          <>
            <Subheading>Top reactions</Subheading>
            <RankedChips items={stats.reactions.top} />
          </>
        )}
        {names.map((name, person) => (
          <Stack key={name} spacing={1}>
            <Subheading>{name}</Subheading>
            <RankedChips items={stats.words[person].words} />
            <RankedChips items={stats.words[person].emojis} />
          </Stack>
        ))}
      </Section>
    </Stack>
  );
}
