import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';

const base = '/chat-stats';

export default defineConfig({
  site: 'https://tletelieru.github.io',
  base,
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Chat Stats',
        short_name: 'Chat Stats',
        description: 'Telegram and WhatsApp export analyzer. Nothing leaves your device.',
        theme_color: '#17181c',
        background_color: '#17181c',
        display: 'standalone',
        start_url: `${base}/`,
        scope: `${base}/`,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: null,
        globPatterns: ['**/*.{html,js,css,svg,png,ico,webp,woff,woff2,txt}'],
      },
    }),
  ],
});
