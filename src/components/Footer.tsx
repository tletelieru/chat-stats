import { IconButton, Stack, Link, Tooltip, Typography } from '@mui/material';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import { GitHubIcon } from './icons';

const GITHUB_URL = 'https://github.com/tletelieru';
const SITE_URL = 'https://tletelieru.github.io/tletelieru/';

export default function Footer() {
  const t = useMessages(messages).footer;

  return (
    <Stack
      component="footer"
      direction="row"
      spacing={0.5}
      sx={{ alignItems: 'center', justifyContent: 'center', pt: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        {t.developedBy}{' '}
        <Link href={SITE_URL} target="_blank" rel="noreferrer">
          tletelieru
        </Link>
      </Typography>
      <Tooltip title="GitHub">
        <IconButton
          size="small"
          aria-label="GitHub"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
