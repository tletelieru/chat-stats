import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '~/i18n/react';
import { lazyChunk } from './lazyChunk';

function renderChunk(load: () => Promise<{ default: () => React.JSX.Element }>) {
  const Chunk = lazyChunk(load);
  render(
    <LocaleProvider locale="en">
      <Suspense fallback={null}>
        <Chunk />
      </Suspense>
    </LocaleProvider>,
  );
}

describe('lazyChunk', () => {
  it('renders the loaded component', async () => {
    renderChunk(async () => ({ default: () => <p>loaded</p> }));
    expect(await screen.findByText('loaded')).toBeInTheDocument();
  });

  it('shows a warning when the chunk cannot be fetched', async () => {
    renderChunk(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  });
});
