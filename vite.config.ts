import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const githubPagesBase = '/AuditM-Field/';

export default defineConfig({
  base: githubPagesBase,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AuditM-Field',
        short_name: 'AuditM',
        description:
          'Configurable PWA for field photo audits, image annotation, dynamic checklists, and ZIP/JSON export.',
        theme_color: '#111827',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: githubPagesBase,
        scope: githubPagesBase,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
