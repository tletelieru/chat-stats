import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

type Props = {
  error?: string;
  onFiles: (files: File[]) => void;
};

const FOLDER_INPUT = { webkitdirectory: '' };

export default function Dropzone({ error, onFiles }: Props) {
  const [dragging, setDragging] = useState(false);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) onFiles([...event.target.files]);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) onFiles([...event.dataTransfer.files]);
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        data-testid="dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Drop a chat export here
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Telegram result.json, WhatsApp .txt or .zip
        </Typography>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
          <Button component="label" variant="contained">
            Choose file
            <input
              hidden
              type="file"
              aria-label="Chat export file"
              accept=".json,.txt,.zip"
              onChange={onPick}
            />
          </Button>
          <Button component="label" variant="outlined">
            Choose export folder
            <input
              hidden
              type="file"
              aria-label="Chat export folder"
              onChange={onPick}
              {...FOLDER_INPUT}
            />
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Pick the Telegram export folder to identify stickers and GIFs. They stay on this device.
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Everything runs on this device. Nothing is uploaded or stored.
      </Typography>
    </Stack>
  );
}
