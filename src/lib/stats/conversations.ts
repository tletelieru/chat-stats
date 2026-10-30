import { HOUR_MS, messageRef, monthKey } from './context';
import type { Accumulator, PassContext } from './context';
import { GrowableFloats, percentile } from './quickselect';
import type { Bursts, Conversations, PersonResponses, ResponsePair } from './types';

const MINUTE_MS = 60_000;
const HISTOGRAM_LIMITS = [MINUTE_MS, 5 * MINUTE_MS, 30 * MINUTE_MS, HOUR_MS, 6 * HOUR_MS];
const WEEK_MS = 7 * 24 * HOUR_MS;

type ResponseState = {
  values: GrowableFloats;
  sum: number;
  shortest: { ms: number; question: number; answer: number } | null;
  longest: { ms: number; question: number; answer: number } | null;
  histogram: number[];
  monthly: Map<string, { sum: number; count: number }>;
  hourSum: number[];
  hourCount: number[];
};

export type ConversationResult = {
  conversations: Conversations;
  responses: PersonResponses[];
  bursts: Bursts[];
};

export function createConversations(context: PassContext): Accumulator<ConversationResult> {
  const { columns, people, localTs } = context;
  const { ts, author } = columns;

  const started = new Array<number>(people).fill(0);
  const ended = new Array<number>(people).fill(0);
  const bursts: Bursts[] = Array.from({ length: people }, () => ({
    double: 0,
    triple: 0,
    longest: 0,
  }));
  const states: ResponseState[] = Array.from({ length: people }, () => ({
    values: new GrowableFloats(),
    sum: 0,
    shortest: null,
    longest: null,
    histogram: new Array<number>(HISTOGRAM_LIMITS.length + 1).fill(0),
    monthly: new Map(),
    hourSum: new Array<number>(24).fill(0),
    hourCount: new Array<number>(24).fill(0),
  }));

  let total = 0;
  let first = -1;
  let last = -1;
  let convoStart = -1;
  let convoMessages = 0;
  let runLength = 0;
  let longest: Conversations['longest'] = null;
  let longestSilence: Conversations['longestSilence'] = null;

  const closeBurst = (person: number) => {
    const burst = bursts[person];
    if (runLength === 2) burst.double++;
    if (runLength >= 3) burst.triple++;
    if (runLength > burst.longest) burst.longest = runLength;
    runLength = 0;
  };

  const closeConvo = (index: number) => {
    ended[author[index]]++;
    closeBurst(author[index]);
    const durationMs = ts[index] - ts[convoStart];
    if (!longest || durationMs > longest.durationMs) {
      longest = {
        startTs: ts[convoStart],
        endTs: ts[index],
        durationMs,
        messages: convoMessages,
      };
    }
  };

  const recordResponse = (prev: number, index: number) => {
    const ms = ts[index] - ts[prev];
    const state = states[author[index]];
    state.values.push(ms);
    state.sum += ms;
    if (!state.shortest || ms < state.shortest.ms) {
      state.shortest = { ms, question: prev, answer: index };
    }
    if (!state.longest || ms > state.longest.ms) {
      state.longest = { ms, question: prev, answer: index };
    }

    let bucket = HISTOGRAM_LIMITS.findIndex((limit) => ms < limit);
    if (bucket === -1) bucket = HISTOGRAM_LIMITS.length;
    state.histogram[bucket]++;

    const local = localTs(index);
    const month = monthKey(local);
    const entry = state.monthly.get(month);
    if (entry) {
      entry.sum += ms;
      entry.count++;
    } else {
      state.monthly.set(month, { sum: ms, count: 1 });
    }

    const hour = Math.floor(local / HOUR_MS) % 24;
    state.hourSum[hour] += ms;
    state.hourCount[hour]++;
  };

  const pair = (entry: { ms: number; question: number; answer: number } | null) =>
    (entry && {
      ms: entry.ms,
      question: messageRef(columns, entry.question),
      answer: messageRef(columns, entry.answer),
    }) satisfies ResponsePair | null;

  return {
    add(index, prev, startsConvo) {
      if (first === -1) first = index;
      last = index;

      if (startsConvo) {
        total++;
        started[author[index]]++;
        if (prev >= 0) {
          closeConvo(prev);
          const durationMs = ts[index] - ts[prev];
          if (!longestSilence || durationMs > longestSilence.durationMs) {
            longestSilence = { fromTs: ts[prev], toTs: ts[index], durationMs };
          }
        }
        convoStart = index;
        convoMessages = 0;
      } else if (author[index] !== author[prev]) {
        closeBurst(author[prev]);
        recordResponse(prev, index);
      }

      convoMessages++;
      runLength++;
    },

    result() {
      if (last >= 0) closeConvo(last);

      const spanMs = first >= 0 ? ts[last] - ts[first] : 0;
      return {
        conversations: {
          total,
          perWeek: total / Math.max(1, spanMs / WEEK_MS),
          started,
          ended,
          longest,
          longestSilence,
        },
        bursts,
        responses: states.map((state) => {
          const values = state.values.view();
          return {
            count: values.length,
            avgMs: values.length ? state.sum / values.length : null,
            medianMs: percentile(values, 0.5),
            p90Ms: percentile(values, 0.9),
            shortest: pair(state.shortest),
            longest: pair(state.longest),
            histogram: state.histogram,
            monthly: [...state.monthly]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, { sum, count }]) => ({ month, avgMs: sum / count })),
            byHour: state.hourSum.map((sum, hour) =>
              state.hourCount[hour] ? sum / state.hourCount[hour] : null,
            ),
          };
        }),
      };
    },
  };
}
