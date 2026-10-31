import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { FolderIcon, UploadIcon } from '~/components/icons';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

type Props = {
  error?: string;
  onFiles: (files: File[]) => void;
};

const FOLDER_INPUT = { webkitdirectory: '' };

export default function Dropzone({ error, onFiles }: Props) {
  const t = useMessages(messages);
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
          bgcolor: 'background.paper',
          borderRadius: 1.75,
          px: { xs: 2.5, md: 6 },
          py: { xs: 4, md: 6 },
          textAlign: 'center',
          transition: 'border-color 150ms, transform 150ms',
          transform: dragging ? 'scale(1.01)' : 'none',
        }}
      >
        <UploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" component="p" gutterBottom>
          {t.dropzone.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t.dropzone.formats}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'center' }}
        >
          <Button component="label" variant="contained" size="large">
            {t.dropzone.chooseFile}
            <input
              hidden
              type="file"
              aria-label={t.dropzone.fileLabel}
              accept=".json,.txt,.zip"
              onChange={onPick}
            />
          </Button>
          <Button component="label" variant="outlined" size="large" startIcon={<FolderIcon />}>
            {t.dropzone.chooseFolder}
            <input
              hidden
              type="file"
              aria-label={t.dropzone.folderLabel}
              onChange={onPick}
              {...FOLDER_INPUT}
            />
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t.dropzone.folderHint}
        </Typography>
      </Box>
    </Stack>
  );
}
