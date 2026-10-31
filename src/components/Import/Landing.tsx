import { Box, Grid, Stack, Typography } from '@mui/material';
import { BoltIcon, ChartIcon, LockIcon, TelegramIcon, WhatsAppIcon } from '~/components/icons';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import type { SavedStats } from '~/lib/saved';
import Dropzone from './Dropzone';
import SavedList from './SavedList';

const PROMISE_ICONS = [LockIcon, BoltIcon, ChartIcon];
const GUIDE_LOGOS = {
  Telegram: { Logo: TelegramIcon, color: '#26a5e4' },
  WhatsApp: { Logo: WhatsAppIcon, color: '#25d366' },
};
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

type Props = {
  error?: string;
  onFiles: (files: File[]) => void;
  onOpenSaved: (saved: SavedStats) => void;
};

export default function Landing({ error, onFiles, onOpenSaved }: Props) {
  const t = useMessages(messages);

  return (
    <Stack spacing={5}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', pt: { xs: 2, md: 5 } }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.25rem', md: '3.5rem' },
            lineHeight: 1.08,
            maxWidth: 760,
            background: (theme) =>
              `linear-gradient(120deg, ${theme.palette.text.primary} 35%, ${theme.palette.primary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {t.hero.title}
        </Typography>
        <Typography
          variant="h6"
          component="p"
          color="text.secondary"
          sx={{ maxWidth: 620, fontWeight: 400 }}
        >
          {t.hero.subtitle}
        </Typography>
      </Stack>

      <Box sx={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        <Dropzone error={error} onFiles={onFiles} />
      </Box>

      <Grid container spacing={2}>
        {t.promises.map(({ title, body }, index) => {
          const Icon = PROMISE_ICONS[index];
          return (
            <Grid key={title} size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.5}>
                <Icon color="primary" />
                <div>
                  <Typography variant="subtitle2" component="h2">
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {body}
                  </Typography>
                </div>
              </Stack>
            </Grid>
          );
        })}
      </Grid>

      <SavedList onOpen={onOpenSaved} />

      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          {t.howTo.title}
        </Typography>
        <Grid container spacing={2}>
          {t.howTo.guides.map(({ name, steps, images }) => {
            const { Logo, color } = GUIDE_LOGOS[name];
            return (
              <Grid key={name} size={12}>
                <Box
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Logo aria-hidden sx={{ color }} />
                    <Typography variant="subtitle2" component="h3">
                      {name}
                    </Typography>
                  </Stack>
                  <Box
                    component="ol"
                    sx={{ m: 0, pl: 2.5, color: 'text.secondary', typography: 'body2' }}
                  >
                    {steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </Box>
                  {images && (
                    <Box
                      sx={{
                        mt: 2,
                        display: 'grid',
                        gap: 1.5,
                        alignItems: 'start',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 210px))',
                      }}
                    >
                      {images.map(({ src, alt }) => (
                        <Box
                          key={src}
                          component="img"
                          src={`${BASE_PATH}/${src}`}
                          alt={alt}
                          loading="lazy"
                          sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {t.privacy}
      </Typography>
    </Stack>
  );
}
