import { LinearProgress, Stack, Typography } from '@mui/material';
import type { MediaState } from '~/components/useChatSession';
import type { Ranked, Stickers } from '~/lib/stats/types';
import { Section, Subheading } from './parts';

const THUMB_SIZE = 72;
const TOP_PER_PERSON = 6;

const isVideo = (key: string) => /\.(mp4|webm)$/i.test(key);
const shortName = (key: string) => key.slice(key.lastIndexOf('/') + 1);

function Item({ item, thumbs }: { item: Ranked; thumbs: Record<string, string> }) {
  const url = thumbs[item.key];
  const label = shortName(item.key);
  const size = { width: THUMB_SIZE, height: THUMB_SIZE, objectFit: 'contain' } as const;

  return (
    <Stack spacing={0.5} sx={{ alignItems: 'center', width: THUMB_SIZE + 16 }}>
      {url &&
        (isVideo(item.key) ? (
          <video src={url} muted loop autoPlay playsInline style={size} aria-label={label} />
        ) : (
          <img src={url} alt={label} style={size} />
        ))}
      {!url && (
        <Typography variant="h5" noWrap sx={{ maxWidth: THUMB_SIZE + 16 }}>
          {label}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        {item.count.toLocaleString()}
      </Typography>
    </Stack>
  );
}

function Row({ items, thumbs }: { items: Ranked[]; thumbs: Record<string, string> }) {
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
      {items.map((item) => (
        <Item key={item.key} item={item} thumbs={thumbs} />
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
  const thumbs = media?.thumbs ?? {};
  const hashing = media && media.ratio > 0 && media.ratio < 1;

  return (
    <Section title="Stickers and GIFs">
      {hashing && (
        <Stack spacing={0.5}>
          <Typography variant="body2">Identifying stickers and GIFs</Typography>
          <LinearProgress variant="determinate" value={media.ratio * 100} />
        </Stack>
      )}
      {stickers.overall.length === 0 && <Typography color="text.secondary">None</Typography>}
      <Row items={stickers.overall} thumbs={thumbs} />
      {names.map((name, person) => {
        const signature = stickers.signature[person];
        const asReply = stickers.asReplyTo[person];
        if (stickers.perPerson[person].length === 0 && !asReply) return null;
        return (
          <Stack key={name} spacing={1}>
            <Subheading>{name}</Subheading>
            <Row items={stickers.perPerson[person].slice(0, TOP_PER_PERSON)} thumbs={thumbs} />
            {signature && (
              <>
                <Typography variant="body2">Signature</Typography>
                <Row items={[signature]} thumbs={thumbs} />
              </>
            )}
            {asReply && (
              <>
                <Typography variant="body2">Most used as a reply to {name}</Typography>
                <Row items={[asReply]} thumbs={thumbs} />
              </>
            )}
          </Stack>
        );
      })}
    </Section>
  );
}
