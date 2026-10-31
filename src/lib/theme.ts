import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

export const colorModeKey = 'color-mode';

const FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function pickColorMode(saved: string | null, prefersDark: boolean): ColorMode {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersDark ? 'dark' : 'light';
}

export function createAppTheme(mode: ColorMode): Theme {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#8ea1ff' : '#3b4fe4' },
      background: dark
        ? { default: '#17181c', paper: '#1f2127' }
        : { default: '#f6f6f8', paper: '#ffffff' },
      divider: dark ? 'rgba(255,255,255,0.09)' : 'rgba(23,24,28,0.09)',
      text: dark
        ? { primary: '#f2f2f4', secondary: '#a9abb5' }
        : { primary: '#17181c', secondary: '#5b5d68' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: FONT,
      h1: { fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10, paddingInline: 18 } },
      },
      MuiCard: { styleOverrides: { root: { borderRadius: 18 } } },
      MuiTableCell: {
        styleOverrides: { root: { borderColor: dark ? 'rgba(255,255,255,0.07)' : undefined } },
      },
    },
  });
}
