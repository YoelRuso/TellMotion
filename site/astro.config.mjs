import {defineConfig} from 'astro/config';

// Deploy to GitHub Pages: SITE_URL=https://<user>.github.io BASE_PATH=/tellmotion npm run build
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  devToolbar: {enabled: false},
});
