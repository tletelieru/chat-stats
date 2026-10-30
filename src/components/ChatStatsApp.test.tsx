import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChatStatsApp from './ChatStatsApp';

describe('ChatStatsApp', () => {
  it('renders the title', () => {
    render(<ChatStatsApp />);
    expect(screen.getByRole('heading', { name: 'Chat Stats' })).toBeInTheDocument();
  });
});
