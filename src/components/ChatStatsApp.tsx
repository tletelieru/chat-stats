import { Container, CssBaseline, ThemeProvider, Typography, createTheme } from '@mui/material';

const theme = createTheme({ colorSchemes: { dark: true } });

export default function ChatStatsApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1">
          Chat Stats
        </Typography>
        <Typography color="text.secondary">
          Telegram and WhatsApp export analyzer. Nothing leaves your device.
        </Typography>
      </Container>
    </ThemeProvider>
  );
}
