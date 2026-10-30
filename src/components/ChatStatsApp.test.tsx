import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ChatStatsApp from './ChatStatsApp';

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
    expect(screen.getByRole('heading', { name: 'Chat Stats' })).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });
});
