import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LoadedChat } from '~/components/useChatSession';
import ChatPicker from './ChatPicker';
import Dropzone from './Dropzone';
import ReviewPeople from './ReviewPeople';

const chat: LoadedChat = {
  name: 'Ana',
  source: 'whatsapp',
  messageCount: 3,
  counts: [1, 2],
  unknownMedia: 2,
  people: [
    { id: 'a', name: 'Ana' },
    { id: 'b', name: 'Beto' },
  ],
  preview: [{ ts: 0, author: 'Ana', kind: 'text', text: 'hola' }],
};

describe('Dropzone', () => {
  it('sends the chosen file', async () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    const file = new File(['x'], 'result.json');
    await userEvent.upload(screen.getByLabelText('Chat export file'), file);
    expect(onFiles).toHaveBeenCalledWith([file]);
  });
});

describe('ChatPicker', () => {
  const chats = [
    { index: 0, name: 'Grupo', messageCount: 1 },
    { index: 1, name: 'Ana', messageCount: 5 },
  ];

  it('sorts by size, filters and picks', async () => {
    const onPick = vi.fn();
    render(<ChatPicker chats={chats} onPick={onPick} />);
    const items = screen.getAllByRole('button');
    expect(items[0]).toHaveTextContent('Ana');
    await userEvent.type(screen.getByLabelText('Search chats'), 'gru');
    await userEvent.click(screen.getByRole('button', { name: /Grupo/ }));
    expect(onPick).toHaveBeenCalledWith(0);
  });
});

describe('ReviewPeople', () => {
  it('offers the default color and passes the chosen one', async () => {
    const onConfirm = vi.fn();
    render(<ReviewPeople chat={chat} onConfirm={onConfirm} />);
    expect(screen.getByLabelText('Color for Beto')).toHaveAttribute('data-color', '#2a78d6');
    expect(screen.getByLabelText('Color for Ana')).toHaveAttribute('data-color', '#eb6834');
    fireEvent.click(screen.getByLabelText('Color for Ana'));
    fireEvent.click(await screen.findByRole('button', { name: '#e0189c' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show stats' }));
    expect(onConfirm).toHaveBeenCalledWith({}, {}, { a: '#e0189c' });
  });

  it('shows the preview and the unknown media warning', () => {
    render(<ReviewPeople chat={chat} onConfirm={vi.fn()} />);
    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('2 media messages');
  });

  it('confirms renames and merges', async () => {
    const onConfirm = vi.fn();
    render(<ReviewPeople chat={chat} onConfirm={onConfirm} />);
    const name = screen.getByLabelText('Name for Ana');
    await userEvent.clear(name);
    await userEvent.type(name, 'Anita');
    await userEvent.click(screen.getByRole('combobox', { name: 'Merge Beto into' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByText('Ana'));
    await userEvent.click(screen.getByRole('button', { name: 'Show stats' }));
    expect(onConfirm).toHaveBeenCalledWith({ a: 'Anita' }, { b: 'a' }, {});
  });
});
