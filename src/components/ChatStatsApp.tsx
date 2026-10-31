import {
  Container,
  CssBaseline,
  LinearProgress,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { messages } from '~/i18n/messages';
import { pickLocale, preferredLocaleKey } from '~/i18n/locales';
import type { Locale } from '~/i18n/locales';
import { LocaleProvider, useMessages } from '~/i18n/react';
import type { SavedStats } from '~/lib/saved';
import { colorModeKey, createAppTheme, pickColorMode } from '~/lib/theme';
import type { ColorMode } from '~/lib/theme';
import Header from './Header';
import ChatPicker from './Import/ChatPicker';
import Landing from './Import/Landing';
import ReviewPeople from './Import/ReviewPeople';
import { useChatSession } from './useChatSession';

const StatsPage = lazy(() => import('./Stats/StatsPage'));
const StatsView = lazy(() => import('./Stats/StatsView'));

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

type ContentProps = {
  locale: Locale;
  mode: ColorMode;
  onLocale: (locale: Locale) => void;
  onToggleMode: () => void;
};

function Content({ locale, mode, onLocale, onToggleMode }: ContentProps) {
  const t = useMessages(messages);
  const { state, stats, media, openFiles, pickChat, confirmPeople, compute, reset } =
    useChatSession();
  const [saved, setSaved] = useState<SavedStats | null>(null);
  const hasContent = state.phase !== 'empty' || saved !== null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Header
          locale={locale}
          mode={mode}
          onLocale={onLocale}
          onToggleMode={onToggleMode}
          onNewChat={
            hasContent
              ? () => {
                  setSaved(null);
                  reset();
                }
              : undefined
          }
        />

        {state.phase === 'empty' && !saved && (
          <Landing
            error={state.error && t.errors[state.error]}
            onFiles={openFiles}
            onOpenSaved={setSaved}
          />
        )}
        {saved && (
          <Suspense fallback={<LinearProgress />}>
            <Typography variant="h5" component="h1">
              {saved.name}
            </Typography>
            <StatsView stats={saved.stats} timeZone={saved.timeZone} />
          </Suspense>
        )}
        {state.phase === 'parsing' && (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 1.5 }}>
            <Stack spacing={1.5}>
              <Typography>{t.progress[state.step]}</Typography>
              <LinearProgress variant="determinate" value={Math.min(state.ratio, 1) * 100} />
            </Stack>
          </Paper>
        )}
        {state.phase === 'pick' && <ChatPicker chats={state.chats} onPick={pickChat} />}
        {state.phase === 'review' && (
          <ReviewPeople
            chat={state.chat}
            onConfirm={(names, aliases, colors) =>
              confirmPeople(state.chat, names, aliases, colors)
            }
          />
        )}
        {state.phase === 'stats' && (
          <Suspense fallback={<LinearProgress />}>
            <StatsPage chat={state.chat} stats={stats} media={media} onCompute={compute} />
          </Suspense>
        )}
      </Stack>
    </Container>
  );
}

export default function ChatStatsApp() {
  const [locale, setLocale] = useState<Locale>(() =>
    pickLocale(localStorage.getItem(preferredLocaleKey), navigator.languages),
  );
  const [mode, setMode] = useState<ColorMode>(() =>
    pickColorMode(localStorage.getItem(colorModeKey), prefersDark()),
  );
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.style.colorScheme = mode;
  }, [locale, mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocaleProvider locale={locale}>
        <Content
          locale={locale}
          mode={mode}
          onLocale={(next) => {
            localStorage.setItem(preferredLocaleKey, next);
            setLocale(next);
          }}
          onToggleMode={() => {
            const next = mode === 'dark' ? 'light' : 'dark';
            localStorage.setItem(colorModeKey, next);
            setMode(next);
          }}
        />
      </LocaleProvider>
    </ThemeProvider>
  );
}
