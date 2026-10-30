import { STOPWORDS } from './stopwords';

const TOKEN = new RegExp(
  "\\p{Extended_Pictographic}(?:\\ufe0f|\\u200d\\p{Extended_Pictographic}|\\p{Emoji_Modifier})*|[\\p{L}][\\p{L}\\p{M}\\p{N}'_-]*",
  'gu',
);
const EMOJI_START = new RegExp('^\\p{Extended_Pictographic}', 'u');
const LAUGH_WORD = /^(?:(?:ja|je|ji|ha|he)[jh]?){2,}|^(?:js)+j?$|^x+d+$/;
const LAUGH_EMOJI = new Set(['😂', '🤣']);

export const TOKEN_EMOJI = 1;
export const TOKEN_STOPWORD = 2;
export const TOKEN_LAUGH = 4;

export type TokenTable = {
  dictionary: string[];
  flags: Uint8Array;
  offsets: Uint32Array;
  tokens: Int32Array;
};

function tokenFlags(token: string): number {
  if (EMOJI_START.test(token)) {
    return TOKEN_EMOJI | (LAUGH_EMOJI.has(token) ? TOKEN_LAUGH : 0);
  }
  return (STOPWORDS.has(token) ? TOKEN_STOPWORD : 0) | (LAUGH_WORD.test(token) ? TOKEN_LAUGH : 0);
}

export function tokenizeTexts(texts: string[]): TokenTable {
  const ids = new Map<string, number>();
  const dictionary: string[] = [];
  const offsets = new Uint32Array(texts.length + 1);
  let tokens = new Int32Array(Math.max(1024, texts.length * 4));
  let size = 0;

  for (let index = 0; index < texts.length; index++) {
    const text = texts[index];
    if (text) {
      for (const [match] of text.toLowerCase().matchAll(TOKEN)) {
        let id = ids.get(match);
        if (id === undefined) {
          id = dictionary.length;
          ids.set(match, id);
          dictionary.push(match);
        }
        if (size === tokens.length) {
          const next = new Int32Array(tokens.length * 2);
          next.set(tokens);
          tokens = next;
        }
        tokens[size++] = id;
      }
    }
    offsets[index + 1] = size;
  }

  return {
    dictionary,
    flags: Uint8Array.from(dictionary, tokenFlags),
    offsets,
    tokens: tokens.slice(0, size),
  };
}
