import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import type { MediaState } from '~/components/useChatSession';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';
import type { Ranked, Stickers } from '~/lib/stats/types';
import { Section, Subheading } from './parts';

const THUMB_SIZE = 72;
const TOP_PER_PERSON = 6;

const isVideo = (key: string) => /\.(mp4|webm)$/i.test(key);
const isGif = (key: string) => isVideo(key) || /\.gif$/i.test(key) || key === '(gif)';
const isMediaKey = (key: string) => /[./]/.test(key) || /^\(.+\)$/.test(key);
const shortName = (key: string) => key.slice(key.lastIndexOf('/') + 1);

function Thumbnail({ itemKey, url }: { itemKey: string; url?: string }) {
  const t = useMessages(messages);
  const label = shortName(itemKey);
  const size = { width: THUMB_SIZE, height: THUMB_SIZE, objectFit: 'contain' } as const;

  if (url && isVideo(itemKey)) {
    return <video src={url} muted loop autoPlay playsInline style={size} aria-label={label} />;
  }
  if (url) return <img src={url} alt={label} style={size} />;
  if (!isMediaKey(itemKey)) return <Typography variant="h3">{itemKey}</Typography>;

  return (
    <Box
      title={label}
      sx={{
        display: 'grid',
        placeItems: 'center',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 1.25,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {isGif(itemKey) ? t.stats.gif : t.stats.sticker}
      </Typography>
    </Box>
  );
}

function Row({ items, thumbs }: { items: Ranked[]; thumbs: Record<string, string> }) {
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
      {items.map(({ key, count }) => (
        <Stack key={key} spacing={0.5} sx={{ alignItems: 'center', width: THUMB_SIZE + 16 }}>
          <Thumbnail itemKey={key} url={thumbs[key]} />
          <Typography variant="body2" color="text.secondary">
            {count.toLocaleString()}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

type Props = {
  stickers: Stickers;
  names: string[];
  media?: MediaState;
};

export default function MediaRanking({ stickers, names, media }: Props) {
  const t = useMessages(messages);
  const thumbs = media?.thumbs ?? {};
  const hashing = media && media.ratio > 0 && media.ratio < 1;
  const missingPreview =
    media?.ratio === 1 &&
    Object.keys(thumbs).length === 0 &&
    stickers.overall.some(({ key }) => /[./]/.test(key));
  const comparable = stickers.perPerson.filter((items) => items.length > 0).length > 1;

  return (
    <Section title={t.sections.stickers}>
      {hashing && (
        <Stack spacing={0.5}>
          <Typography variant="body2">{t.stats.identifying}</Typography>
          <LinearProgress variant="determinate" value={media.ratio * 100} />
        </Stack>
      )}
      {stickers.overall.length === 0 && (
        <Typography color="text.secondary">{t.stats.none}</Typography>
      )}
      <Row items={stickers.overall} thumbs={thumbs} />
      {missingPreview && (
        <Typography variant="body2" color="text.secondary">
          {t.stats.previewHint}
        </Typography>
      )}
      {comparable &&
        names.map((name, person) => {
          const signature = stickers.signature[person];
          const asReply = stickers.asReplyTo[person];
          if (stickers.perPerson[person].length === 0 && !asReply) return null;
          return (
            <Stack key={name} spacing={1}>
              <Subheading>{name}</Subheading>
              <Row items={stickers.perPerson[person].slice(0, TOP_PER_PERSON)} thumbs={thumbs} />
              {signature && (
                <>
                  <Typography variant="body2">{t.stats.signature}</Typography>
                  <Row items={[signature]} thumbs={thumbs} />
                </>
              )}
              {asReply && (
                <>
                  <Typography variant="body2">{t.stats.replyTo(name)}</Typography>
                  <Row items={[asReply]} thumbs={thumbs} />
                </>
              )}
            </Stack>
          );
        })}
    </Section>
  );
}
