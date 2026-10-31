import { Box, Popover } from '@mui/material';
import { createContext, useContext, useState } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

type PersonColors = {
  colors: string[];
  setColor: (person: number, color: string) => void;
};

const SWATCHES = [
  '#3987e5',
  '#2ea3e6',
  '#199e70',
  '#22c55e',
  '#d95926',
  '#e66767',
  '#e0189c',
  '#9085e9',
  '#c98500',
  '#f5c518',
  '#8a8984',
  '#f2f2f4',
];

export const PersonColorContext = createContext<PersonColors>({
  colors: [],
  setColor: () => undefined,
});

export const usePersonColors = () => useContext(PersonColorContext);

type ColorDotProps = {
  name: string;
  color: string;
  size?: number;
  onChange: (color: string) => void;
};

export function ColorDot({ name, color, size = 16, onChange }: ColorDotProps) {
  const t = useMessages(messages);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const label = t.stats.colorFor(name);

  const choose = (next: string) => {
    onChange(next);
    setAnchor(null);
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={label}
        title={label}
        data-color={color}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          flexShrink: 0,
          width: size,
          height: size,
          p: 0,
          mr: 0.75,
          verticalAlign: '-3px',
          border: 2,
          borderColor: 'divider',
          borderRadius: '50%',
          cursor: 'pointer',
          bgcolor: color,
        }}
      />
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <Box sx={{ p: 1.5, display: 'grid', gap: 1, gridTemplateColumns: 'repeat(4, 40px)' }}>
          {SWATCHES.map((swatch) => (
            <Box
              key={swatch}
              component="button"
              type="button"
              aria-label={swatch}
              aria-pressed={swatch === color}
              onClick={() => choose(swatch)}
              sx={{
                width: 40,
                height: 40,
                p: 0,
                border: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: swatch,
                outline: swatch === color ? 2 : 0,
                outlineStyle: 'solid',
                outlineColor: 'text.primary',
                outlineOffset: 2,
              }}
            />
          ))}
          <Box
            component="label"
            sx={{
              gridColumn: '1 / -1',
              py: 0.75,
              textAlign: 'center',
              typography: 'button',
              color: 'primary.main',
              cursor: 'pointer',
            }}
          >
            {t.stats.customColor}
            <input
              hidden
              type="color"
              aria-label={t.stats.customColor}
              value={color}
              onChange={(event) => onChange(event.target.value)}
            />
          </Box>
        </Box>
      </Popover>
    </>
  );
}

export function PersonSwatch({ person, name }: { person: number; name: string }) {
  const { colors, setColor } = usePersonColors();
  const color = colors[person];
  if (!color) return null;
  return <ColorDot name={name} color={color} onChange={(next) => setColor(person, next)} />;
}
