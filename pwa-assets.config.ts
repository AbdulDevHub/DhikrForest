import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the PNG app icons from public/favicon.svg:
//   pnpm exec pwa-assets-generator
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#08180e' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#08180e' } },
  },
  images: ['public/favicon.svg'],
});
