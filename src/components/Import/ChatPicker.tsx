import { List, ListItemButton, ListItemText, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { ChatSummary } from '~/lib/model';

type Props = {
  chats: ChatSummary[];
  onPick: (index: number) => void;
};

export default function ChatPicker({ chats, onPick }: Props) {
  const [query, setQuery] = useState('');
  const visible = chats
    .filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.messageCount - a.messageCount);

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        Pick a chat
      </Typography>
      <TextField
        size="small"
        label="Search chats"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <List dense>
        {visible.map(({ index, name, type, messageCount }) => (
          <ListItemButton key={index} onClick={() => onPick(index)}>
            <ListItemText
              primary={name}
              secondary={`${type ?? 'chat'} · ${messageCount.toLocaleString()} messages`}
            />
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );
}
