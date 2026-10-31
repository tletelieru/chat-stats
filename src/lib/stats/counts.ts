import { MESSAGE_KINDS } from '~/lib/model';
import type { MessageKind } from '~/lib/model';
import {
  CALL_MISSED,
  CALL_UNATTRIBUTED,
  FLAG_DELETED,
  FLAG_EDITED,
  FLAG_FORWARDED,
  KIND_ID,
} from './columns';
import { messageRef, topRanked } from './context';
import type { Accumulator, PassContext } from './context';
import type {
  PersonCalls,
  PersonFlags,
  PersonMedia,
  PersonTotals,
  Ranked,
  Reactions,
  Replies,
  Stickers,
} from './types';

const VOICE = KIND_ID.voice;
const VIDEO_NOTE = KIND_ID.video_note;
const TOP_MEDIA = 20;
const TOP_REPLIED = 5;
const TOP_EMOJIS = 15;

export type CountResult = {
  totals: PersonTotals[];
  media: PersonMedia[];
  flags: PersonFlags[];
  replies: Replies;
  reactions: Reactions;
  stickers: Stickers;
};

function emptyKinds(): Record<MessageKind, number> {
  return Object.fromEntries(MESSAGE_KINDS.map((kind) => [kind, 0])) as Record<MessageKind, number>;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function signatureOf(own: Map<string, number>, overall: Map<string, number>): Ranked | null {
  let best: Ranked | null = null;
  let bestScore = 0;
  for (const [key, count] of own) {
    const others = (overall.get(key) ?? 0) - count;
    const score = count / (others + 1);
    if (count >= 2 && score > bestScore) {
      bestScore = score;
      best = { key, count };
    }
  }
  return best;
}

export function createCounts(context: PassContext): Accumulator<CountResult> {
  const { columns, people } = context;
  const { author, kind, flags, durationSec, linkCount, replyTo, mediaKey, mediaKeys } = columns;
  const { offsets, tokens, flags: tokenFlags } = columns.tokens;

  const messages = new Array<number>(people).fill(0);
  const words = new Array<number>(people).fill(0);
  const chars = new Array<number>(people).fill(0);
  const media: PersonMedia[] = Array.from({ length: people }, () => ({
    kinds: emptyKinds(),
    links: 0,
    voiceSec: 0,
    voiceCount: 0,
    longestVoiceSec: 0,
  }));
  const flagCounts: PersonFlags[] = Array.from({ length: people }, () => ({
    edited: 0,
    forwarded: 0,
    deleted: 0,
  }));
  const sent = new Array<number>(people).fill(0);
  const received = new Array<number>(people).fill(0);
  const repliedTo = new Map<number, number>();
  const given = new Array<number>(people).fill(0);
  const reactionCounts = new Map<string, number>();
  const stickerOverall = new Map<string, number>();
  const stickerPerPerson = Array.from({ length: people }, () => new Map<string, number>());
  const stickerReplyTo = Array.from({ length: people }, () => new Map<string, number>());

  return {
    add(index, prev, startsConvo) {
      const person = author[index];
      const messageKind = kind[index];
      messages[person]++;
      chars[person] += columns.text[index].length;

      for (let cursor = offsets[index]; cursor < offsets[index + 1]; cursor++) {
        if (!(tokenFlags[tokens[cursor]] & 1)) words[person]++;
      }

      const personMedia = media[person];
      personMedia.kinds[MESSAGE_KINDS[messageKind]]++;
      personMedia.links += linkCount[index];
      if (messageKind === VOICE || messageKind === VIDEO_NOTE) {
        const duration = durationSec[index];
        personMedia.voiceSec += duration;
        personMedia.voiceCount++;
        if (duration > personMedia.longestVoiceSec) personMedia.longestVoiceSec = duration;
      }

      const flag = flags[index];
      if (flag & FLAG_EDITED) flagCounts[person].edited++;
      if (flag & FLAG_FORWARDED) flagCounts[person].forwarded++;
      if (flag & FLAG_DELETED) flagCounts[person].deleted++;

      const target = replyTo[index];
      if (target >= 0 && author[target] !== person) {
        sent[person]++;
        received[author[target]]++;
        repliedTo.set(target, (repliedTo.get(target) ?? 0) + 1);
      }

      for (
        let cursor = columns.reactionOffsets[index];
        cursor < columns.reactionOffsets[index + 1];
        cursor++
      ) {
        const by = columns.reactionBy[cursor];
        if (by >= 0) given[by]++;
        bump(reactionCounts, columns.emojis[columns.reactionEmoji[cursor]]);
      }

      if (mediaKey[index] >= 0) {
        const key = mediaKeys[mediaKey[index]];
        bump(stickerOverall, key);
        bump(stickerPerPerson[person], key);
        if (!startsConvo && prev >= 0 && author[prev] !== person) {
          bump(stickerReplyTo[author[prev]], key);
        }
      }
    },

    result() {
      const totalMessages = messages.reduce((sum, value) => sum + value, 0);
      return {
        totals: messages.map((count, person) => ({
          messages: count,
          words: words[person],
          chars: chars[person],
          avgLength: count ? chars[person] / count : 0,
          share: totalMessages ? count / totalMessages : 0,
        })),
        media,
        flags: flagCounts,
        replies: {
          sent,
          received,
          top: [...repliedTo]
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_REPLIED)
            .map(([index, count]) => ({ ...messageRef(columns, index), count })),
        },
        reactions: { given, top: topRanked(reactionCounts, TOP_EMOJIS) },
        stickers: {
          overall: topRanked(stickerOverall, TOP_MEDIA),
          perPerson: stickerPerPerson.map((counts) => topRanked(counts, TOP_MEDIA)),
          signature: stickerPerPerson.map((counts) => signatureOf(counts, stickerOverall)),
          asReplyTo: stickerReplyTo.map((counts) => topRanked(counts, 1)[0] ?? null),
        },
      };
    },
  };
}

export function createCalls(
  context: PassContext,
): Accumulator<{ people: PersonCalls[]; unattributed: number }> {
  const { columns, people } = context;
  const calls: PersonCalls[] = Array.from({ length: people }, () => ({
    count: 0,
    durationSec: 0,
    missed: 0,
    longestSec: 0,
  }));

  let unattributed = 0;

  return {
    add(index) {
      if (columns.callState[index] === CALL_UNATTRIBUTED) {
        unattributed++;
        return;
      }
      const call = calls[columns.author[index]];
      const duration = columns.durationSec[index];
      call.count++;
      call.durationSec += duration;
      if (columns.callState[index] === CALL_MISSED) call.missed++;
      if (duration > call.longestSec) call.longestSec = duration;
    },
    result: () => ({ people: calls, unattributed }),
  };
}
