import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import type { MediaState } from '~/components/useChatSession';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import type { MessageKind } from '~/lib/model';
import { defaultColors } from '~/lib/palette';
import type { MessageRef, ResponsePair, StatsResult } from '~/lib/stats/types';
import Chart, { useChartTheme } from './Chart';
import CalendarHeatmap from './CalendarHeatmap';
import {
  buildSeries,
  groupedBars,
  dominantHeatmap,
  hourHeatmap,
  lines,
  stackedBars,
} from './charts';
import {
  HOURS,
  date,
  dateTime,
  duration,
  hour,
  number,
  percent,
  sortByMax,
  weekday,
} from './format';
import type { CountRow } from './format';
import Highlights from './Highlights';
import MediaRanking from './MediaRanking';
import { PersonTable, RankedChips, Section, Subheading, Tile, Tiles } from './parts';
import type { Row } from './parts';
import { PersonColorContext } from './personColors';

const MEDIA_KINDS: MessageKind[] = [
  'photo',
  'video',
  'voice',
  'video_note',
  'audio',
  'sticker',
  'gif',
  'file',
  'location',
  'poll',
  'contact',
  'unknown_media',
];

const MIN_REPLIES = 3;
const EVERYONE = 'everyone';

function quote({ preview, kind }: MessageRef, mediaLabel: string): string {
  if (preview) return `: “${preview}”`;
  return kind && kind !== 'text' ? `: ${mediaLabel}` : '';
}

const hasDetail = ({ question, answer }: ResponsePair, mediaLabel: string) =>
  Boolean(quote(question, mediaLabel) || quote(answer, mediaLabel));

type PairProps = {
  label: string;
  pair: ResponsePair;
  names: string[];
  timeZone: string;
};

function Pair({ label, pair, names, timeZone }: PairProps) {
  const t = useMessages(messages);
  return (
    <Typography variant="body2">
      <strong>
        {label} ({duration(pair.ms)}, {dateTime(pair.answer.ts, timeZone)}):
      </strong>{' '}
      {names[pair.question.author]}
      {quote(pair.question, t.stats.media)} → {names[pair.answer.author]}
      {quote(pair.answer, t.stats.media)}
    </Typography>
  );
}

type Props = {
  stats: StatsResult;
  timeZone: string;
  media?: MediaState;
  chosenColors?: Record<string, string>;
  hideQuotes?: boolean;
};

export default function StatsView({ stats, timeZone, media, chosenColors, hideQuotes }: Props) {
  const t = useMessages(messages);
  const s = t.stats;
  const theme = useChartTheme();
  const names = useMemo(() => stats.people.map(({ name }) => name), [stats.people]);
  const weights = stats.overview.perPerson.map(({ messages: count }) => count);
  const [overrides, setOverrides] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      stats.people.flatMap(({ id }, person) =>
        chosenColors?.[id] ? [[person, chosenColors[id]]] : [],
      ),
    ),
  );
  const [weightsRef] = useState(weights);
  const [heatPerson, setHeatPerson] = useState(EVERYONE);
  const [period, setPeriod] = useState<'weeks' | 'months'>('months');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { overview, conversations, responses, activity } = stats;
  const colors = useMemo(
    () => defaultColors(weightsRef, theme).map((color, person) => overrides[person] ?? color),
    [weightsRef, theme, overrides],
  );
  const colorContext = useMemo(
    () => ({
      colors,
      setColor: (person: number, color: string) =>
        setOverrides((current) => ({ ...current, [person]: color })),
    }),
    [colors],
  );
  const series = (rows: (number | null)[][]) =>
    buildSeries(names, rows, weights, theme, s.other, colors);

  const multipleMonths = activity.months.length > 1;
  const timeline = activity[multipleMonths ? period : 'weeks'];
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

  const day = activity.days.find((entry) => entry.day === selectedDay);

  const mostReplied = hideQuotes
    ? []
    : stats.replies.top.filter(({ count }) => count >= MIN_REPLIES);

  const conversationRows: Row[] = [
    [s.started, (p) => number(conversations.started[p]), (p) => conversations.started[p]],
    [s.ended, (p) => number(conversations.ended[p]), (p) => conversations.ended[p]],
    [s.doubleTexts, (p) => number(stats.bursts[p].double), (p) => stats.bursts[p].double],
    [s.tripleTexts, (p) => number(stats.bursts[p].triple), (p) => stats.bursts[p].triple],
    [s.longestBurst, (p) => number(stats.bursts[p].longest), (p) => stats.bursts[p].longest],
    [s.repliesUsed, (p) => number(stats.replies.sent[p]), (p) => stats.replies.sent[p]],
    [s.repliesReceived, (p) => number(stats.replies.received[p]), (p) => stats.replies.received[p]],
  ];

  const responseRows: Row[] = [
    [s.responses, (p) => number(responses[p].count), (p) => responses[p].count],
    [s.average, (p) => duration(responses[p].avgMs), (p) => responses[p].avgMs, true],
    [s.median, (p) => duration(responses[p].medianMs), (p) => responses[p].medianMs, true],
    ['p90', (p) => duration(responses[p].p90Ms), (p) => responses[p].p90Ms, true],
    [
      s.shortest,
      (p) => duration(responses[p].shortest?.ms ?? null),
      (p) => responses[p].shortest?.ms ?? null,
      true,
    ],
    [
      s.longest,
      (p) => duration(responses[p].longest?.ms ?? null),
      (p) => responses[p].longest?.ms ?? null,
      true,
    ],
  ];

  const countRows: CountRow[] = [
    ...MEDIA_KINDS.map((kind): CountRow => [
      t.kinds[kind] ?? kind,
      (p) => stats.media[p].kinds[kind],
    ]),
    [s.links, (p) => stats.media[p].links],
    [s.edited, (p) => stats.flags[p].edited],
    [s.forwarded, (p) => stats.flags[p].forwarded],
    [s.deleted, (p) => stats.flags[p].deleted],
  ];

  const mediaRows: Row[] = [
    ...sortByMax(countRows, names.length).map(([label, value]): Row => [
      label,
      (p) => number(value(p)),
      value,
    ]),
    [
      s.voiceMinutes,
      (p) => (stats.media[p].voiceSec / 60).toFixed(1),
      (p) => stats.media[p].voiceSec,
    ],
    [
      s.avgVoice,
      (p) =>
        duration(
          stats.media[p].voiceCount
            ? (stats.media[p].voiceSec / stats.media[p].voiceCount) * 1000
            : null,
        ),
    ],
    [
      s.longestVoice,
      (p) => duration(stats.media[p].longestVoiceSec * 1000),
      (p) => stats.media[p].longestVoiceSec * 1000,
    ],
  ];

  const unattributedCalls = stats.unattributedCalls ?? 0;

  const callRows: Row[] = [
    [s.callsMade, (p) => number(stats.calls[p].count), (p) => stats.calls[p].count],
    [
      s.totalTime,
      (p) => duration(stats.calls[p].durationSec * 1000),
      (p) => stats.calls[p].durationSec * 1000,
    ],
    [s.missed, (p) => number(stats.calls[p].missed), (p) => stats.calls[p].missed],
    [
      s.longestCall,
      (p) => duration(stats.calls[p].longestSec * 1000),
      (p) => stats.calls[p].longestSec * 1000,
    ],
  ];

  const timeRows: Row[] = [
    [s.topHour, (p) => hour(activity.perPerson[p].topHour)],
    [s.topWeekday, (p) => weekday(activity.perPerson[p].topWeekday, t.weekdays)],
    [s.firstHour, (p) => hour(activity.perPerson[p].earliestHour)],
    [s.lastHour, (p) => hour(activity.perPerson[p].latestHour)],
    ...t.partsOfDay.map((label, part): Row => [
      label,
      (p) => number(activity.perPerson[p].partsOfDay[part]),
      (p) => activity.perPerson[p].partsOfDay[part],
    ]),
  ];

  const wordRows: Row[] = [
    [s.laughs, (p) => number(stats.words[p].laughs), (p) => stats.words[p].laughs],
    [s.faces, (p) => number(stats.words[p].faceCount), (p) => stats.words[p].faceCount],
    [s.questions, (p) => number(stats.words[p].questions), (p) => stats.words[p].questions],
    [
      s.upperMessages,
      (p) => number(stats.words[p].upperMessages),
      (p) => stats.words[p].upperMessages,
    ],
    [s.upperWords, (p) => number(stats.words[p].upperWords), (p) => stats.words[p].upperWords],
    [s.phraseMatches, (p) => number(stats.words[p].phrase), (p) => stats.words[p].phrase],
    [s.reactionsGiven, (p) => number(stats.reactions.given[p]), (p) => stats.reactions.given[p]],
  ];

  return (
    <PersonColorContext value={colorContext}>
      <Stack spacing={2}>
        <Highlights stats={stats} />

        <Section title={t.sections.overview}>
          <Tiles>
            <Tile label={s.messages} value={number(overview.messages)} />
            <Tile label={s.words} value={number(overview.words)} />
            <Tile label={s.characters} value={number(overview.chars)} />
            <Tile
              label={s.daysActive}
              value={`${number(overview.daysActive)} / ${number(overview.daysTotal)}`}
            />
            <Tile label={s.firstMessage} value={date(overview.firstTs, timeZone)} />
            <Tile label={s.lastMessage} value={date(overview.lastTs, timeZone)} />
          </Tiles>
          <PersonTable
            names={names}
            rows={[
              [
                s.messages,
                (p) => number(overview.perPerson[p].messages),
                (p) => overview.perPerson[p].messages,
              ],
              [
                s.share,
                (p) => percent(overview.perPerson[p].share),
                (p) => overview.perPerson[p].share,
              ],
              [
                s.words,
                (p) => number(overview.perPerson[p].words),
                (p) => overview.perPerson[p].words,
              ],
              [
                s.avgLength,
                (p) => number(overview.perPerson[p].avgLength),
                (p) => Math.round(overview.perPerson[p].avgLength),
              ],
            ]}
          />
        </Section>

        <Section title={t.sections.conversations}>
          <Tiles>
            <Tile label={s.conversations} value={number(conversations.total)} />
            <Tile label={s.perWeek} value={conversations.perWeek.toFixed(1)} />
            <Tile
              label={s.longestConversation}
              value={
                conversations.longest
                  ? `${duration(conversations.longest.durationMs)}, ${number(conversations.longest.messages)} ${s.msgs}`
                  : '–'
              }
            />
            <Tile
              label={s.longestSilence}
              value={duration(conversations.longestSilence?.durationMs ?? null)}
            />
          </Tiles>
          <PersonTable names={names} rows={conversationRows} />
          {mostReplied.length > 0 && <Subheading>{s.mostReplied}</Subheading>}
          {mostReplied.map((message) => (
            <Typography key={`${message.ts}-${message.author}`} variant="body2">
              {message.count.toLocaleString()} × {names[message.author]},{' '}
              {dateTime(message.ts, timeZone)}
              {quote(message, s.media)}
            </Typography>
          ))}
        </Section>

        <Section title={t.sections.responses}>
          <PersonTable names={names} rows={responseRows} />
          {responses.map(({ shortest, longest }, person) => (
            <Stack key={names[person]} spacing={0.5}>
              {!hideQuotes && shortest && hasDetail(shortest, s.media) && (
                <Pair
                  label={s.pairShortest(names[person])}
                  pair={shortest}
                  names={names}
                  timeZone={timeZone}
                />
              )}
              {!hideQuotes && longest && hasDetail(longest, s.media) && (
                <Pair
                  label={s.pairLongest(names[person])}
                  pair={longest}
                  names={names}
                  timeZone={timeZone}
                />
              )}
            </Stack>
          ))}
          <Subheading>{s.distribution}</Subheading>
          <Chart
            label={t.charts.distribution}
            option={groupedBars(
              t.buckets,
              series(responses.map(({ histogram }) => histogram)),
              theme,
            )}
          />
          {multipleMonths && (
            <>
              <Subheading>{s.monthlyAverage}</Subheading>
              <Chart
                label={t.charts.monthly}
                option={lines(months, monthlySeries, theme, duration)}
              />
            </>
          )}
          <Subheading>{s.byHour}</Subheading>
          <Chart
            label={t.charts.byHour}
            option={lines(HOURS, series(responses.map(({ byHour }) => byHour)), theme, duration)}
          />
        </Section>

        <Section title={t.sections.media}>
          <PersonTable names={names} rows={mediaRows} />
        </Section>

        <MediaRanking stickers={stats.stickers} names={names} media={media} />

        <Section title={t.sections.calls}>
          {unattributedCalls > 0 && (
            <>
              <Tiles>
                <Tile label={s.callsTotal} value={number(unattributedCalls)} />
              </Tiles>
              <Typography variant="body2" color="text.secondary">
                {s.callsNoDetail}
              </Typography>
            </>
          )}
          {(unattributedCalls === 0 || stats.calls.some(({ count }) => count > 0)) && (
            <PersonTable names={names} rows={callRows} />
          )}
        </Section>

        <Section title={t.sections.activity}>
          <Tiles>
            <Tile
              label={
                activity.busiestDay ? `${s.busiestDay} (${activity.busiestDay.day})` : s.busiestDay
              }
              value={number(activity.busiestDay?.count ?? 0)}
            />
            <Tile
              label={
                activity.longestStreak
                  ? s.since(s.longestStreak, activity.longestStreak.from)
                  : s.longestStreak
              }
              value={s.days(number(activity.longestStreak?.days ?? 0))}
            />
            <Tile
              label={
                activity.longestGap ? s.since(s.longestGap, activity.longestGap.from) : s.longestGap
              }
              value={s.days(number(activity.longestGap?.days ?? 0))}
            />
          </Tiles>
          <Subheading>{s.perDay}</Subheading>
          <CalendarHeatmap days={activity.days} selected={selectedDay} onSelect={setSelectedDay} />
          {day && (
            <Typography variant="body2">
              {day.day}:{' '}
              {names.map((name, person) => `${name} ${day.perPerson[person]}`).join(', ')}
            </Typography>
          )}
          {multipleMonths ? (
            <TextField
              data-export-hide
              select
              size="small"
              label={s.timeline}
              value={period}
              sx={{ maxWidth: 200 }}
              onChange={(event) => setPeriod(event.target.value as 'weeks' | 'months')}
            >
              <MenuItem value="months">{s.perMonth}</MenuItem>
              <MenuItem value="weeks">{s.perWeekOption}</MenuItem>
            </TextField>
          ) : (
            <Subheading>{s.perWeekOption}</Subheading>
          )}
          <Chart
            label={t.charts.timeline}
            option={stackedBars(
              timeline.map(({ period: label }) => label),
              timelineSeries,
              theme,
            )}
          />
          <TextField
            data-export-hide
            select
            size="small"
            label={s.heatmapPerson}
            value={heatPerson}
            sx={{ maxWidth: 260 }}
            onChange={(event) => setHeatPerson(event.target.value)}
          >
            <MenuItem value={EVERYONE}>{t.filters.everyone}</MenuItem>
            {names.map((name, person) => (
              <MenuItem key={name} value={String(person)}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <Chart
            label={t.charts.heatmap}
            option={
              heatPerson === EVERYONE
                ? dominantHeatmap({
                    perPerson: activity.perPerson.map(({ heat }) => heat),
                    names,
                    colors,
                    hours: HOURS,
                    weekdays: t.weekdays,
                    theme,
                    tieColor: theme.other,
                  })
                : hourHeatmap(
                    activity.perPerson[Number(heatPerson)].heat,
                    HOURS,
                    t.weekdays,
                    theme,
                    colors[Number(heatPerson)],
                  )
            }
            height={280}
          />
          {heatPerson === EVERYONE && (
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 2 }}>
              {[...names.map((name, person) => [name, colors[person]]), [s.tie, theme.other]].map(
                ([label, color]) => (
                  <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: color }} />
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                  </Stack>
                ),
              )}
            </Stack>
          )}
          <PersonTable names={names} rows={timeRows} />
        </Section>

        <Section title={t.sections.words}>
          <PersonTable names={names} rows={wordRows} />
          {stats.reactions.top.length > 0 && (
            <>
              <Subheading>{s.topReactions}</Subheading>
              <RankedChips items={stats.reactions.top} emoji />
            </>
          )}
          {names.map((name, person) => (
            <Stack key={name} spacing={1}>
              <Subheading>{name}</Subheading>
              <RankedChips items={stats.words[person].words} />
              <RankedChips items={stats.words[person].emojis} emoji />
              {stats.words[person].faces.length > 0 && (
                <RankedChips items={stats.words[person].faces} />
              )}
            </Stack>
          ))}
        </Section>
      </Stack>
    </PersonColorContext>
  );
}
