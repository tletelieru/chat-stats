import { Button, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import { listSaved, removeSaved } from '~/lib/saved';
import type { SavedStats } from '~/lib/saved';

export default function SavedList({ onOpen }: { onOpen: (saved: SavedStats) => void }) {
  const t = useMessages(messages).saved;
  const [saved, setSaved] = useState<SavedStats[]>([]);

  useEffect(() => {
    void listSaved().then(setSaved);
  }, []);

  if (saved.length === 0) return null;

  return (
    <>
      <Typography variant="h6" component="h2">
        {t.title}
      </Typography>
      <List dense>
        {saved.map((entry) => (
          <ListItem
            key={entry.id}
            disablePadding
            secondaryAction={
              <Button
                aria-label={t.remove(entry.name)}
                onClick={() => {
                  void removeSaved(entry.id as number)
                    .then(listSaved)
                    .then(setSaved);
                }}
              >
                {t.removeLabel}
              </Button>
            }
          >
            <ListItemButton onClick={() => onOpen(entry)}>
              <ListItemText
                primary={entry.name}
                secondary={new Date(entry.savedAt).toLocaleString()}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
}
