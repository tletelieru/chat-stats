import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import type { RefObject } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import {
  EXPORT_FILE_NAME,
  PIXEL_RATIOS,
  downloadBlob,
  renderPdf,
  shareableFile,
  withFallback,
} from '~/lib/exportPdf';

const LAYOUT_DELAY_MS = 1200;

type Props = {
  open: boolean;
  target: RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrepare: (includeQuotes: boolean) => void;
  onFinish: () => void;
};

export default function ExportDialog({ open, target, onClose, onPrepare, onFinish }: Props) {
  const t = useMessages(messages).exportPdf;
  const { palette } = useTheme();
  const [includeQuotes, setIncludeQuotes] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const shareFile = blob && shareableFile(blob);

  const reset = () => {
    setBlob(null);
    setFailure(null);
    setProgress(null);
    onClose();
  };

  const generate = async () => {
    setFailure(null);
    setProgress(0);
    onPrepare(includeQuotes);
    try {
      await new Promise((resolve) => setTimeout(resolve, LAYOUT_DELAY_MS));
      const node = target.current;
      if (!node) throw new Error('Nothing to export');
      const pdf = await withFallback(PIXEL_RATIOS, (ratio) => {
        setProgress(0);
        return renderPdf(node, palette.background.default, setProgress, ratio);
      });
      setBlob(pdf);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      onFinish();
      setProgress(null);
    }
  };

  const share = async () => {
    if (!shareFile) return;
    try {
      await navigator.share({ files: [shareFile], title: t.shareTitle });
    } catch {
      return;
    }
  };

  return (
    <Dialog open={open} onClose={progress === null ? reset : undefined} fullWidth maxWidth="xs">
      <DialogTitle>{t.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {failure !== null && (
            <Alert severity="error">
              {t.failed} ({failure})
            </Alert>
          )}
          {progress !== null && (
            <Stack spacing={1}>
              <Typography variant="body2">{t.generating}</Typography>
              <LinearProgress variant="determinate" value={progress * 100} />
            </Stack>
          )}
          {progress === null && !blob && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeQuotes}
                  onChange={(event) => setIncludeQuotes(event.target.checked)}
                />
              }
              label={t.includeQuotes}
            />
          )}
          {blob && <Alert severity="success">{t.ready}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={reset} disabled={progress !== null}>
          {t.close}
        </Button>
        {!blob && (
          <Button variant="contained" onClick={() => void generate()} disabled={progress !== null}>
            {t.generate}
          </Button>
        )}
        {blob && (
          <Button
            variant={shareFile ? 'outlined' : 'contained'}
            onClick={() => downloadBlob(blob, EXPORT_FILE_NAME)}
          >
            {t.download}
          </Button>
        )}
        {shareFile && (
          <Button variant="contained" onClick={() => void share()}>
            {t.share}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
