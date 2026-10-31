import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: { chunkSizeWarningLimit: 700 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'DhikrForest: Plant Trees in Jannah',
        short_name: 'DhikrForest',
        description:
          'A free, offline dhikr counter (digital tasbih) that plants a tree in your Jannah forest with every SubhanAllah.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#060011',
        theme_color: '#060011',
        categories: ['lifestyle', 'education', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: 'screenshots/wide.png', sizes: '1440x900', type: 'image/png', form_factor: 'wide', label: 'Your forest in Jannah' },
          { src: 'screenshots/narrow.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'Dhikr counter on a phone' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        globIgnores: ['**/screenshots/**', '**/og-image.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
