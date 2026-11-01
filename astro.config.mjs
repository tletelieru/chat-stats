import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import { cspIntegration } from './scripts/csp.mjs';

const base = '/chat-stats';

export default defineConfig({
  site: 'https://tletelieru.github.io',
  base,
  trailingSlash: 'always',
  integrations: [
    react(),
    cspIntegration(),
    AstroPWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
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
        share_target: {
          action: `${base}/share-target`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'file',
                accept: [
                  'application/zip',
                  'text/plain',
                  'application/json',
                  '.zip',
                  '.txt',
                  '.json',
                ],
              },
            ],
          },
        },
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,webp,woff,woff2,txt}'],
        globIgnores: [
          '_astro/{StatsPage,StatsView,jspdf.es.min,html2canvas,purify.es,index.es,es}.*.js',
          'tutorial/**',
        ],
      },
    }),
  ],
});
