import { createActivity } from './activity';
import { CALL_UNATTRIBUTED, KIND_ID, lowerBound } from './columns';
import type { Columns } from './columns';
import { DAY_MS, createContext } from './context';
import { createConversations } from './conversations';
import { createCalls, createCounts } from './counts';
import type { Filter, StatsResult } from './types';
import { createWords } from './words';

const CALL = KIND_ID.call;
const SERVICE = KIND_ID.service;

export function computeStats(columns: Columns, filter: Filter): StatsResult {
  const context = createContext(columns, filter);
  const { ts, kind, author } = columns;

  const start = filter.from === undefined ? 0 : lowerBound(ts, filter.from);
  const end = filter.to === undefined ? columns.size : lowerBound(ts, filter.to);

  const conversations = createConversations(context);
  const counts = createCounts(context);
  const calls = createCalls(context);
  const activity = createActivity(context);
  const words = createWords(context);

  const person = filter.person;
  const gapMs = filter.gapMs;
  let prev = -1;
  let messageCount = 0;

  for (let index = start; index < end; index++) {
    const messageKind = kind[index];
    if (messageKind === SERVICE) continue;

    const included = person === undefined || author[index] === person;

    if (messageKind === CALL) {
      if (included || columns.callState[index] === CALL_UNATTRIBUTED) {
        calls.add(index, prev, false);
      }
      continue;
    }

    const startsConvo = prev < 0 || ts[index] - ts[prev] >= gapMs;
    conversations.add(index, prev, startsConvo);

    if (included) {
      messageCount++;
      counts.add(index, prev, startsConvo);
      activity.add(index, prev, startsConvo);
      words.add(index, prev, startsConvo);
    }

    prev = index;
  }

  const conversationResult = conversations.result();
  const countResult = counts.result();
  const activityResult = activity.result();
  const totals = countResult.totals;
  const callResult = calls.result();
  const firstDay = activityResult.days[0]?.day;
  const lastDay = activityResult.days.at(-1)?.day;

  return {
    people: columns.people,
    messageCount,
    overview: {
      messages: messageCount,
      words: totals.reduce((sum, { words: value }) => sum + value, 0),
      chars: totals.reduce((sum, { chars }) => sum + chars, 0),
      daysActive: activityResult.days.length,
      daysTotal:
        firstDay && lastDay ? (Date.parse(lastDay) - Date.parse(firstDay)) / DAY_MS + 1 : 0,
      firstTs: end > start ? ts[start] : null,
      lastTs: end > start ? ts[end - 1] : null,
      perPerson: totals,
    },
    conversations: conversationResult.conversations,
    responses: conversationResult.responses,
    bursts: conversationResult.bursts,
    replies: countResult.replies,
    media: countResult.media,
    flags: countResult.flags,
    calls: callResult.people,
    unattributedCalls: callResult.unattributed,
    reactions: countResult.reactions,
    stickers: countResult.stickers,
    activity: activityResult,
    words: words.result(),
  };
}

export function filterKey(filter: Filter): string {
  return JSON.stringify([
    filter.from,
    filter.to,
    filter.person,
    filter.gapMs,
    filter.timeZone,
    filter.participantTimeZones,
    filter.phrase,
  ]);
}

export function createStatsCache(columns: Columns) {
  const cache = new Map<string, StatsResult>();
  return (filter: Filter): StatsResult => {
    const key = filterKey(filter);
    let result = cache.get(key);
    if (!result) {
      result = computeStats(columns, filter);
      cache.set(key, result);
    }
    return result;
  };
}
