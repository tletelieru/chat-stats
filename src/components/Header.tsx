import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMessages } from '~/i18n/react';
import { messages } from '~/i18n/messages';
import { locales } from '~/i18n/locales';
import type { Locale } from '~/i18n/locales';
import type { ColorMode } from '~/lib/theme';
import { MoonIcon, SunIcon } from './icons';

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

type Props = {
  locale: Locale;
  mode: ColorMode;
  onLocale: (locale: Locale) => void;
  onToggleMode: () => void;
  onNewChat?: () => void;
};

export default function Header({ locale, mode, onLocale, onToggleMode, onNewChat }: Props) {
  const t = useMessages(messages);
  const modeLabel = mode === 'dark' ? t.toLight : t.toDark;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        component="img"
        src={`${BASE_PATH}/favicon.svg`}
        alt=""
        sx={{ width: 36, height: 36, display: 'block' }}
      />
      <Typography component="p" sx={{ fontWeight: 700, letterSpacing: '-0.02em', flexGrow: 1 }}>
        {t.appName}
      </Typography>
      {onNewChat && (
        <Button size="small" onClick={onNewChat}>
          {t.newChat}
        </Button>
      )}
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label={t.language}
        value={locale}
        onChange={(_, next: Locale | null) => {
          if (next) onLocale(next);
        }}
      >
        {locales.map((option) => (
          <ToggleButton key={option} value={option} sx={{ px: 1.25, py: 0.4, fontWeight: 700 }}>
            {option.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Tooltip title={modeLabel}>
        <IconButton aria-label={modeLabel} onClick={onToggleMode}>
          {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
