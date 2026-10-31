import { Box } from '@mui/material';
import { createContext, useContext } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

type PersonColors = {
  colors: string[];
  setColor: (person: number, color: string) => void;
};

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
  return (
    <Box
      component="input"
      type="color"
      aria-label={t.stats.colorFor(name)}
      title={t.stats.colorFor(name)}
      value={color}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        flexShrink: 0,
        width: size,
        height: size,
        p: 0,
        mr: 0.75,
        verticalAlign: '-3px',
        border: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'none',
        '&::-webkit-color-swatch-wrapper': { p: 0 },
        '&::-webkit-color-swatch': { border: 0, borderRadius: '50%' },
        '&::-moz-color-swatch': { border: 0, borderRadius: '50%' },
      }}
    />
  );
}

export function PersonSwatch({ person, name }: { person: number; name: string }) {
  const { colors, setColor } = usePersonColors();
  const color = colors[person];
  if (!color) return null;
  return <ColorDot name={name} color={color} onChange={(next) => setColor(person, next)} />;
}
