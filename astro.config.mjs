// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://blafortree.netlify.app',
  markdown: {
    // Plain <pre> blocks, like HN. No highlighter theme.
    syntaxHighlight: false,
  },
});
