import type { MessageKind, Participant } from '~/lib/model';

export type Filter = {
  from?: number;
  to?: number;
  person?: number;
  gapMs: number;
  timeZone: string;
  participantTimeZones?: Record<number, string>;
  phrase?: string;
};

export type Ranked = {
  key: string;
  count: number;
};

export type MessageRef = {
  ts: number;
  author: number;
  preview: string;
};

export type ResponsePair = {
  ms: number;
  question: MessageRef;
  answer: MessageRef;
};

export type PersonTotals = {
  messages: number;
  words: number;
  chars: number;
  avgLength: number;
  share: number;
};

export type Overview = {
  messages: number;
  words: number;
  chars: number;
  daysActive: number;
  daysTotal: number;
  firstTs: number | null;
  lastTs: number | null;
  perPerson: PersonTotals[];
};

export type Conversations = {
  total: number;
  perWeek: number;
  started: number[];
  ended: number[];
  longest: { startTs: number; endTs: number; durationMs: number; messages: number } | null;
  longestSilence: { fromTs: number; toTs: number; durationMs: number } | null;
};

export type PersonResponses = {
  count: number;
  avgMs: number | null;
  medianMs: number | null;
  p90Ms: number | null;
  shortest: ResponsePair | null;
  longest: ResponsePair | null;
  histogram: number[];
  monthly: { month: string; avgMs: number }[];
  byHour: (number | null)[];
};

export type Bursts = {
  double: number;
  triple: number;
  longest: number;
};

export type Replies = {
  sent: number[];
  received: number[];
  top: (MessageRef & { count: number })[];
};

export type PersonMedia = {
  kinds: Record<MessageKind, number>;
  links: number;
  voiceSec: number;
  voiceCount: number;
  longestVoiceSec: number;
};

export type PersonFlags = {
  edited: number;
  forwarded: number;
  deleted: number;
};

export type PersonCalls = {
  count: number;
  durationSec: number;
  missed: number;
  longestSec: number;
};

export type Reactions = {
  given: number[];
  top: Ranked[];
};

export type Stickers = {
  overall: Ranked[];
  perPerson: Ranked[][];
  signature: (Ranked | null)[];
  asReplyTo: (Ranked | null)[];
};

export type DayCount = {
  day: string;
  total: number;
  perPerson: number[];
};

export type PeriodCount = {
  period: string;
  perPerson: number[];
};

export type PersonActivity = {
  heat: number[];
  topHour: number | null;
  topWeekday: number | null;
  partsOfDay: number[];
  earliestHour: number | null;
  latestHour: number | null;
};

export type Activity = {
  days: DayCount[];
  weeks: PeriodCount[];
  months: PeriodCount[];
  heat: number[];
  perPerson: PersonActivity[];
  busiestDay: { day: string; count: number } | null;
  longestStreak: { days: number; from: string; to: string } | null;
  longestGap: { days: number; from: string; to: string } | null;
};

export type PersonWords = {
  words: Ranked[];
  emojis: Ranked[];
  laughs: number;
  questions: number;
  phrase: number;
};

export type StatsResult = {
  people: Participant[];
  messageCount: number;
  overview: Overview;
  conversations: Conversations;
  responses: PersonResponses[];
  bursts: Bursts[];
  replies: Replies;
  media: PersonMedia[];
  flags: PersonFlags[];
  calls: PersonCalls[];
  reactions: Reactions;
  stickers: Stickers;
  activity: Activity;
  words: PersonWords[];
};
