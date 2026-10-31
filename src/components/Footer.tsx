import { Link, Stack, Typography } from '@mui/material';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

const GITHUB_URL = 'https://github.com/tletelieru';
const SITE_URL = 'https://tletelieru.github.io/tletelieru/';

export default function Footer() {
  const t = useMessages(messages).footer;

  return (
    <Stack
      component="footer"
      direction="row"
      useFlexGap
      sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, pt: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        {t.developedBy}{' '}
        <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
          tletelieru
        </Link>
      </Typography>
      <Link variant="body2" href={SITE_URL} target="_blank" rel="noreferrer">
        {t.site}
      </Link>
    </Stack>
  );
}
