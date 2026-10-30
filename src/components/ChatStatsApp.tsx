import {
  Button,
  Container,
  CssBaseline,
  LinearProgress,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import { Suspense, lazy } from 'react';
import ChatPicker from './Import/ChatPicker';
import Dropzone from './Import/Dropzone';
import ReviewPeople from './Import/ReviewPeople';
import { useChatSession } from './useChatSession';

const StatsPage = lazy(() => import('./Stats/StatsPage'));

const theme = createTheme({ colorSchemes: { dark: true } });

export default function ChatStatsApp() {
  const { state, stats, media, openFiles, pickChat, confirmPeople, compute, reset } =
    useChatSession();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Chat Stats
            </Typography>
            {state.phase !== 'empty' && <Button onClick={reset}>New chat</Button>}
          </Stack>

          {state.phase === 'empty' && <Dropzone error={state.error} onFiles={openFiles} />}
          {state.phase === 'parsing' && (
            <Stack spacing={1}>
              <Typography>{state.label}</Typography>
              <LinearProgress variant="determinate" value={Math.min(state.ratio, 1) * 100} />
            </Stack>
          )}
          {state.phase === 'pick' && <ChatPicker chats={state.chats} onPick={pickChat} />}
          {state.phase === 'review' && (
            <ReviewPeople
              chat={state.chat}
              onConfirm={(names, aliases) => confirmPeople(state.chat, names, aliases)}
            />
          )}
          {state.phase === 'stats' && (
            <Suspense fallback={<LinearProgress />}>
              <StatsPage chat={state.chat} stats={stats} media={media} onCompute={compute} />
            </Suspense>
          )}
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
