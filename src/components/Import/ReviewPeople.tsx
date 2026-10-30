import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { LoadedChat } from '~/components/useChatSession';

type Props = {
  chat: LoadedChat;
  onConfirm: (names: Record<string, string>, aliases: Record<string, string>) => void;
};

export default function ReviewPeople({ chat, onConfirm }: Props) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [aliases, setAliases] = useState<Record<string, string>>({});

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {chat.name}
      </Typography>
      <Typography color="text.secondary">
        {chat.messageCount.toLocaleString()} messages, {chat.people.length} participants
      </Typography>
      {chat.unknownMedia > 0 && (
        <Alert severity="warning">
          {chat.unknownMedia.toLocaleString()} media messages have an unknown type. Re-export the
          chat with media to classify them.
        </Alert>
      )}

      <Stack spacing={0.5}>
        {chat.preview.map((message, index) => (
          <Typography key={index} variant="body2" noWrap>
            <strong>{message.author}:</strong> {message.text || `[${message.kind}]`}
          </Typography>
        ))}
      </Stack>

      {chat.people.map(({ id, name }) => (
        <Stack key={id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            label={`Name for ${name}`}
            value={names[id] ?? name}
            onChange={(event) => setNames({ ...names, [id]: event.target.value })}
          />
          <TextField
            select
            size="small"
            fullWidth
            label={`Merge ${name} into`}
            value={aliases[id] ?? ''}
            onChange={(event) => {
              const others = Object.entries(aliases).filter(([key]) => key !== id);
              const target = event.target.value;
              setAliases(Object.fromEntries(target ? [...others, [id, target]] : others));
            }}
          >
            <MenuItem value="">Keep separate</MenuItem>
            {chat.people
              .filter((other) => other.id !== id && !aliases[other.id])
              .map((other) => (
                <MenuItem key={other.id} value={other.id}>
                  {other.name}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
      ))}

      <Button variant="contained" onClick={() => onConfirm(names, aliases)}>
        Show stats
      </Button>
    </Stack>
  );
}
