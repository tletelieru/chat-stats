import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedStats } from '~/lib/saved';
import ChatStatsApp from './ChatStatsApp';

vi.mock('~/lib/saved', () => ({
  listSaved: async (): Promise<SavedStats[]> => [],
}));

beforeEach(() => localStorage.clear());

beforeAll(() => {
  vi.stubGlobal(
    'Worker',
    class {
      postMessage() {}
      terminate() {}
    },
  );
});

describe('ChatStatsApp', () => {
  it('renders the title and the import screen', () => {
    render(<ChatStatsApp />);
    expect(screen.getByText('Chat Stats')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('credits the developer in the footer', () => {
    render(<ChatStatsApp />);
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'tletelieru' })).toHaveAttribute(
      'href',
      'https://tletelieru.github.io/tletelieru/',
    );
    expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/tletelieru',
    );
  });

  it('switches language and remembers it', async () => {
    render(<ChatStatsApp />);
    await userEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(screen.getByText('Suelta aquí la exportación del chat')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(localStorage.getItem('preferred-lang')).toBe('es');
  });

  it('toggles the color mode and remembers it', async () => {
    render(<ChatStatsApp />);
    await userEvent.click(screen.getByRole('button', { name: /modo oscuro|dark mode/ }));
    expect(localStorage.getItem('color-mode')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
