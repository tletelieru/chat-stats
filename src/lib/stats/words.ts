import { FLAG_QUESTION } from './columns';
import type { Accumulator, PassContext } from './context';
import { TOKEN_EMOJI, TOKEN_LAUGH, TOKEN_STOPWORD } from './tokenize';
import type { PersonWords, Ranked } from './types';

const TOP_WORDS = 20;

function topIds(counts: Map<number, number>, dictionary: string[]): Ranked[] {
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, TOP_WORDS)
    .map(([id, count]) => ({ key: dictionary[id], count }));
}

export function createWords(context: PassContext): Accumulator<PersonWords[]> {
  const { columns, people, filter } = context;
  const { author, flags, text } = columns;
  const { dictionary, flags: tokenFlags, offsets, tokens } = columns.tokens;
  const phrase = filter.phrase?.toLowerCase();

  const states = Array.from({ length: people }, () => ({
    words: new Map<number, number>(),
    emojis: new Map<number, number>(),
    laughs: 0,
    questions: 0,
    phrase: 0,
  }));

  return {
    add(index) {
      const state = states[author[index]];
      let laughed = false;

      for (let cursor = offsets[index]; cursor < offsets[index + 1]; cursor++) {
        const id = tokens[cursor];
        const flag = tokenFlags[id];
        if (flag & TOKEN_LAUGH) laughed = true;
        if (flag & TOKEN_EMOJI) {
          state.emojis.set(id, (state.emojis.get(id) ?? 0) + 1);
        } else if (!(flag & TOKEN_STOPWORD)) {
          state.words.set(id, (state.words.get(id) ?? 0) + 1);
        }
      }

      if (laughed) state.laughs++;
      if (flags[index] & FLAG_QUESTION) state.questions++;
      if (phrase && text[index].toLowerCase().includes(phrase)) state.phrase++;
    },

    result: () =>
      states.map((state) => ({
        words: topIds(state.words, dictionary),
        emojis: topIds(state.emojis, dictionary),
        laughs: state.laughs,
        questions: state.questions,
        phrase: state.phrase,
      })),
  };
}
