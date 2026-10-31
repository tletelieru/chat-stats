import { FLAG_QUESTION, FLAG_UPPER } from './columns';
import type { Accumulator, PassContext } from './context';
import { topRanked } from './context';
import { TOKEN_EMOJI, TOKEN_LAUGH, TOKEN_STOPWORD, isStopword, upperWordsOf } from './tokenize';
import type { PersonWords, Ranked } from './types';

const TOP_WORDS = 20;
const TOP_PHRASES = 5;
const MIN_PHRASE_COUNT = 2;
const SKIPPED_IN_PHRASE = TOKEN_EMOJI | TOKEN_LAUGH;

function topPhrases(counts: Map<string, number>, dictionary: string[]): Ranked[] {
  return topRanked(
    new Map([...counts].filter(([, count]) => count >= MIN_PHRASE_COUNT)),
    TOP_PHRASES,
  ).map(({ key, count }) => ({
    key: key
      .split(',')
      .map((id) => dictionary[Number(id)])
      .join(' '),
    count,
  }));
}

function topIds(counts: Map<number, number>, dictionary: string[]): Ranked[] {
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, TOP_WORDS)
    .map(([id, count]) => ({ key: dictionary[id], count }));
}

export function createWords(context: PassContext): Accumulator<PersonWords[]> {
  const { columns, people, filter } = context;
  const { author, flags, text, upperWords, faceOffsets, faceIds, faces } = columns;
  const { dictionary, flags: tokenFlags, offsets, tokens } = columns.tokens;
  const phrase = filter.phrase?.toLowerCase();

  const states = Array.from({ length: people }, () => ({
    words: new Map<number, number>(),
    emojis: new Map<number, number>(),
    laughs: 0,
    questions: 0,
    upperMessages: 0,
    upperWords: 0,
    shouted: new Map<string, number>(),
    faces: new Map<number, number>(),
    faceCount: 0,
    pairs: new Map<string, number>(),
    triples: new Map<string, number>(),
    phrase: 0,
  }));

  return {
    add(index) {
      const state = states[author[index]];
      let laughed = false;
      let previous = -1;
      let beforePrevious = -1;

      for (let cursor = offsets[index]; cursor < offsets[index + 1]; cursor++) {
        const id = tokens[cursor];
        const flag = tokenFlags[id];
        if (flag & TOKEN_LAUGH) laughed = true;

        if (flag & SKIPPED_IN_PHRASE) {
          previous = -1;
          beforePrevious = -1;
        } else {
          const stopword = flag & TOKEN_STOPWORD;
          if (previous >= 0 && !(stopword && tokenFlags[previous] & TOKEN_STOPWORD)) {
            const key = `${previous},${id}`;
            state.pairs.set(key, (state.pairs.get(key) ?? 0) + 1);
          }
          if (
            beforePrevious >= 0 &&
            !(stopword && tokenFlags[previous] & tokenFlags[beforePrevious] & TOKEN_STOPWORD)
          ) {
            const key = `${beforePrevious},${previous},${id}`;
            state.triples.set(key, (state.triples.get(key) ?? 0) + 1);
          }
          beforePrevious = previous;
          previous = id;
        }

        if (flag & TOKEN_EMOJI) {
          state.emojis.set(id, (state.emojis.get(id) ?? 0) + 1);
        } else if (!(flag & TOKEN_STOPWORD)) {
          state.words.set(id, (state.words.get(id) ?? 0) + 1);
        }
      }

      for (let cursor = faceOffsets[index]; cursor < faceOffsets[index + 1]; cursor++) {
        const id = faceIds[cursor];
        state.faces.set(id, (state.faces.get(id) ?? 0) + 1);
        state.faceCount++;
      }

      if (laughed) state.laughs++;
      if (flags[index] & FLAG_QUESTION) state.questions++;
      if (flags[index] & FLAG_UPPER) state.upperMessages++;
      state.upperWords += upperWords[index];
      if (upperWords[index] > 0) {
        for (const word of upperWordsOf(text[index])) {
          if (!isStopword(word)) state.shouted.set(word, (state.shouted.get(word) ?? 0) + 1);
        }
      }
      if (phrase && text[index].toLowerCase().includes(phrase)) state.phrase++;
    },

    result: () =>
      states.map((state) => ({
        words: topIds(state.words, dictionary),
        emojis: topIds(state.emojis, dictionary),
        laughs: state.laughs,
        questions: state.questions,
        upperMessages: state.upperMessages,
        upperWords: state.upperWords,
        shouted: topRanked(state.shouted, TOP_WORDS),
        faces: topIds(state.faces, faces),
        faceCount: state.faceCount,
        pairs: topPhrases(state.pairs, dictionary),
        triples: topPhrases(state.triples, dictionary),
        phrase: state.phrase,
      })),
  };
}
