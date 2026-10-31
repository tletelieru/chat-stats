import { Alert, Button, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { ColorDot } from '~/components/Stats/personColors';
import type { LoadedChat } from '~/components/useChatSession';
import { chartTheme, defaultColors } from '~/lib/palette';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

type Props = {
  chat: LoadedChat;
  onConfirm: (
    names: Record<string, string>,
    aliases: Record<string, string>,
    colors: Record<string, string>,
  ) => void;
};

export default function ReviewPeople({ chat, onConfirm }: Props) {
  const t = useMessages(messages).review;
  const [names, setNames] = useState<Record<string, string>>({});
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const { palette } = useTheme();
  const defaults = defaultColors(chat.counts, chartTheme(palette.mode));

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {chat.name}
      </Typography>
      <Typography color="text.secondary">
        {t.summary(chat.messageCount.toLocaleString(), chat.people.length)}
      </Typography>
      {chat.unknownMedia > 0 && (
        <Alert severity="warning">{t.unknownMedia(chat.unknownMedia.toLocaleString())}</Alert>
      )}

      <Stack spacing={0.5}>
        {chat.preview.map((message, index) => (
          <Typography key={index} variant="body2" noWrap>
            <strong>{message.author}:</strong> {message.text || `[${message.kind}]`}
          </Typography>
        ))}
      </Stack>

      {chat.people.map(({ id, name }, person) => (
        <Stack key={id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Stack direction="row" sx={{ alignItems: 'center', flexGrow: 1, flexBasis: 0 }}>
            <ColorDot
              name={name}
              size={32}
              color={colors[id] ?? defaults[person]}
              onChange={(color) => setColors({ ...colors, [id]: color })}
            />
            <TextField
              size="small"
              fullWidth
              label={t.nameFor(name)}
              value={names[id] ?? name}
              onChange={(event) => setNames({ ...names, [id]: event.target.value })}
            />
          </Stack>
          <TextField
            select
            size="small"
            sx={{ flexGrow: 1, flexBasis: 0 }}
            label={t.mergeInto(name)}
            value={aliases[id] ?? ''}
            onChange={(event) => {
              const others = Object.entries(aliases).filter(([key]) => key !== id);
              const target = event.target.value;
              setAliases(Object.fromEntries(target ? [...others, [id, target]] : others));
            }}
          >
            <MenuItem value="">{t.keepSeparate}</MenuItem>
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

      <Button variant="contained" onClick={() => onConfirm(names, aliases, colors)}>
        {t.show}
      </Button>
    </Stack>
  );
}
