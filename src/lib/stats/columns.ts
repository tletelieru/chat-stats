import { MESSAGE_KINDS } from '~/lib/model';
import type { Chat, MessageKind, Participant } from '~/lib/model';
import { countUpperCase, keyboardFacesOf, tokenizeTexts } from './tokenize';
import type { TokenTable } from './tokenize';

export const FLAG_EDITED = 1;
export const FLAG_DELETED = 2;
export const FLAG_FORWARDED = 4;
export const FLAG_QUESTION = 8;
export const FLAG_UPPER = 16;

export const KIND_ID = Object.fromEntries(MESSAGE_KINDS.map((kind, id) => [kind, id])) as Record<
  MessageKind,
  number
>;

const MISSED_CALLS = new Set(['missed', 'busy', 'declined']);
export const CALL_MISSED = 1;

export type Columns = {
  size: number;
  people: Participant[];
  ts: Float64Array;
  author: Uint16Array;
  kind: Uint8Array;
  flags: Uint8Array;
  durationSec: Uint32Array;
  replyTo: Int32Array;
  linkCount: Uint16Array;
  upperWords: Uint16Array;
  callState: Uint8Array;
  mediaKey: Int32Array;
  mediaKeys: string[];
  mediaFiles: (string | undefined)[];
  text: string[];
  tokens: TokenTable;
  reactionOffsets: Uint32Array;
  reactionEmoji: Int32Array;
  reactionBy: Int32Array;
  emojis: string[];
  faceOffsets: Uint32Array;
  faceIds: Int32Array;
  faces: string[];
};

export function buildColumns(chat: Chat): Columns {
  const messages = [...chat.messages].sort((a, b) => a.ts - b.ts);
  const size = messages.length;

  const people = [...chat.participants];
  const authorIds = new Map(people.map(({ id }, index) => [id, index]));
  const authorIndex = (id: string) => {
    let index = authorIds.get(id);
    if (index === undefined) {
      index = people.length;
      authorIds.set(id, index);
      people.push({ id, name: id });
    }
    return index;
  };

  const ts = new Float64Array(size);
  const author = new Uint16Array(size);
  const kind = new Uint8Array(size);
  const flags = new Uint8Array(size);
  const durationSec = new Uint32Array(size);
  const replyTo = new Int32Array(size).fill(-1);
  const linkCount = new Uint16Array(size);
  const upperWords = new Uint16Array(size);
  const callState = new Uint8Array(size);
  const mediaKey = new Int32Array(size).fill(-1);
  const mediaKeys: string[] = [];
  const mediaKeyIds = new Map<string, number>();
  const mediaFiles: (string | undefined)[] = [];
  const text: string[] = new Array(size);
  const reactionOffsets = new Uint32Array(size + 1);
  const emojis: string[] = [];
  const emojiIds = new Map<string, number>();
  const reactionEmojiList: number[] = [];
  const reactionByList: number[] = [];
  const indexById = new Map<string, number>();
  const faceOffsets = new Uint32Array(size + 1);
  const faceIdList: number[] = [];
  const faces: string[] = [];
  const faceIds = new Map<string, number>();

  messages.forEach((message, index) => {
    indexById.set(message.id, index);
    ts[index] = message.ts;
    author[index] = authorIndex(message.author);
    kind[index] = KIND_ID[message.kind];
    durationSec[index] = message.durationSec ?? 0;
    linkCount[index] = message.linkCount ?? 0;
    text[index] = message.text ?? '';
    const upper = countUpperCase(text[index]);
    upperWords[index] = upper.words;
    flags[index] =
      (message.edited ? FLAG_EDITED : 0) |
      (message.deleted ? FLAG_DELETED : 0) |
      (message.forwarded ? FLAG_FORWARDED : 0) |
      (message.text?.includes('?') ? FLAG_QUESTION : 0) |
      (upper.isMessage ? FLAG_UPPER : 0);
    if (message.callOutcome && MISSED_CALLS.has(message.callOutcome)) {
      callState[index] = CALL_MISSED;
    }

    if (message.kind === 'sticker' || message.kind === 'gif') {
      const key = message.mediaFile ?? message.stickerEmoji ?? `(${message.kind})`;
      let keyId = mediaKeyIds.get(key);
      if (keyId === undefined) {
        keyId = mediaKeys.length;
        mediaKeyIds.set(key, keyId);
        mediaKeys.push(key);
        mediaFiles.push(message.mediaFile);
      }
      mediaKey[index] = keyId;
    }

    for (const reaction of message.reactions ?? []) {
      let emojiId = emojiIds.get(reaction.emoji);
      if (emojiId === undefined) {
        emojiId = emojis.length;
        emojiIds.set(reaction.emoji, emojiId);
        emojis.push(reaction.emoji);
      }
      reactionEmojiList.push(emojiId);
      reactionByList.push(reaction.by ? authorIndex(reaction.by) : -1);
    }
    reactionOffsets[index + 1] = reactionEmojiList.length;

    for (const face of keyboardFacesOf(text[index])) {
      let faceId = faceIds.get(face);
      if (faceId === undefined) {
        faceId = faces.length;
        faceIds.set(face, faceId);
        faces.push(face);
      }
      faceIdList.push(faceId);
    }
    faceOffsets[index + 1] = faceIdList.length;
  });

  messages.forEach((message, index) => {
    const target = message.replyTo ? indexById.get(message.replyTo) : undefined;
    if (target !== undefined) replyTo[index] = target;
  });

  return {
    size,
    people,
    ts,
    author,
    kind,
    flags,
    durationSec,
    replyTo,
    linkCount,
    upperWords,
    callState,
    mediaKey,
    mediaKeys,
    mediaFiles,
    text,
    tokens: tokenizeTexts(text),
    reactionOffsets,
    reactionEmoji: Int32Array.from(reactionEmojiList),
    reactionBy: Int32Array.from(reactionByList),
    emojis,
    faceOffsets,
    faceIds: Int32Array.from(faceIdList),
    faces,
  };
}

export function applyPeople(
  columns: Columns,
  names: Record<string, string>,
  aliases: Record<string, string>,
): Columns {
  const resolve = (id: string) => aliases[id] ?? id;
  const people: Participant[] = [];
  const remap = columns.people.map(({ id, name }) => {
    const target = resolve(id);
    const existing = people.findIndex((person) => person.id === target);
    if (existing !== -1) return existing;
    const original = columns.people.find((person) => person.id === target);
    people.push({ id: target, name: names[target] ?? original?.name ?? name });
    return people.length - 1;
  });

  return {
    ...columns,
    people,
    author: columns.author.map((index) => remap[index]),
    reactionBy: columns.reactionBy.map((index) => (index < 0 ? index : remap[index])),
  };
}

export function lowerBound(ts: Float64Array, value: number): number {
  let low = 0;
  let high = ts.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (ts[middle] < value) low = middle + 1;
    else high = middle;
  }
  return low;
}
