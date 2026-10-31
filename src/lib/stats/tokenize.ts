import { STOPWORDS } from './stopwords';

const TOKEN = new RegExp(
  "\\p{Extended_Pictographic}(?:\\ufe0f|\\u200d\\p{Extended_Pictographic}|\\p{Emoji_Modifier})*|[\\p{L}][\\p{L}\\p{M}\\p{N}'’_-]*",
  'gu',
);
const LINK = /(?:https?:\/\/|www\.)\S+/gi;
const APOSTROPHES = /['’]/g;
const EMOJI_START = new RegExp('^\\p{Extended_Pictographic}', 'u');
const LAUGH_WORD = /^(?:(?:ja|je|ji|ha|he)[jh]?){2,}|^(?:js)+j?$|^x+d+$|^(?:lol+|lmf?ao+|rofl)$/;
const HOME_ROW = /^[asdfghjklñ]+$/;
const SMASH_MARKER = /[jk]/;
const PHONE_SMASH = /^[bdfghjklnrsw]{5,}$/;
const PHONE_SMASH_MARKER = /[jkd]/;
const MIN_SMASH_LENGTH = 4;
const MIN_SMASH_LENGTH_WITH_VOWEL = 6;
const MAX_SMASH_VOWEL_RATIO = 0.25;
const WORD = new RegExp("\\p{L}[\\p{L}\\p{M}\\p{N}'’_-]*", 'gu');
const TWO_CAPITALS = new RegExp('\\p{Lu}.*\\p{Lu}', 'su');
const NON_LETTER = new RegExp('\\P{L}', 'gu');
const MIN_UPPER_LETTERS = 2;
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

const FACE_START = '(?<![\\p{L}\\p{N}:;=])';
const FACE_END = '(?![\\p{L}\\p{N}\\\\/])';
const FACES = [
  ">?[:;=]['-]?[)(\\][DPpOoc3C|/\\\\*]+",
  "[)(\\]DcC]['-]?[:;=]<?",
  '[xX][dD]+',
  '[uUoO][wW][uUoO]',
  '\\^[_.-]?\\^',
  'T[_.]T',
  '-[_.]-',
  '>[_.]<',
  '\\._\\.',
  '[oO][_.][oO]',
  '<3',
];
const FACE = new RegExp(`${FACE_START}(?:${FACES.join('|')})${FACE_END}`, 'gu');
const LAUGH_FACE = /^([xX])([dD])[dD]+$/;
const FACE_REPEAT = /([)(\][DPpOoc3Cd|/\\*])\1+$/u;

export function keyboardFacesOf(text: string): string[] {
  return [...text.replace(LINK, ' ').matchAll(FACE)].map(([face]) =>
    face.replace(FACE_REPEAT, '$1').replace(LAUGH_FACE, '$1$2'),
  );
}

export function isKeyboardSmash(token: string): boolean {
  if (PHONE_SMASH.test(token) && PHONE_SMASH_MARKER.test(token)) return true;
  if (token.length < MIN_SMASH_LENGTH || !HOME_ROW.test(token) || !SMASH_MARKER.test(token)) {
    return false;
  }
  const vowels = token.split('a').length - 1;
  if (vowels === 0) return true;
  return (
    token.length >= MIN_SMASH_LENGTH_WITH_VOWEL && vowels / token.length <= MAX_SMASH_VOWEL_RATIO
  );
}

const isUpperWord = (letters: string) =>
  letters.length >= MIN_UPPER_LETTERS &&
  letters === letters.toUpperCase() &&
  letters !== letters.toLowerCase();

export function upperWordsOf(text: string): string[] {
  if (!TWO_CAPITALS.test(text)) return [];
  const words = [...text.replace(LINK, ' ').matchAll(WORD)].map(([word]) => word);
  return words.filter((word) => isUpperWord(word.replace(NON_LETTER, '')));
}

export function countUpperCase(text: string): { words: number; isMessage: boolean } {
  const words = upperWordsOf(text).length;
  if (words === 0) return { words, isMessage: false };
  return { words, isMessage: isUpperWord(text.replace(LINK, ' ').replace(NON_LETTER, '')) };
}

export const isStopword = (word: string) =>
  STOPWORDS.has(word.toLowerCase().replace(APOSTROPHES, ''));

function tokenFlags(token: string): number {
  if (EMOJI_START.test(token)) {
    return TOKEN_EMOJI | (LAUGH_EMOJI.has(token) ? TOKEN_LAUGH : 0);
  }
  return (
    (isStopword(token) ? TOKEN_STOPWORD : 0) |
    (LAUGH_WORD.test(token) || isKeyboardSmash(token) ? TOKEN_LAUGH : 0)
  );
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
      for (const [match] of text.toLowerCase().replace(LINK, ' ').matchAll(TOKEN)) {
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
