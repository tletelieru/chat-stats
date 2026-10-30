import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { DragEvent } from 'react';

type Props = {
  error?: string;
  onFile: (file: File) => void;
};

export default function Dropzone({ error, onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
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
        <Button component="label" variant="contained">
          Choose file
          <input
            hidden
            type="file"
            aria-label="Chat export file"
            accept=".json,.txt,.zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Everything runs on this device. Nothing is uploaded or stored.
      </Typography>
    </Stack>
  );
}
