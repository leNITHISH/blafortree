# blafortree

Source for [blafortree.netlify.app](https://blafortree.netlify.app), my portfolio. Built with Astro, set like a product
label: cream paper, numbered rows, and small packaging-style graphics. It ships no client-side JavaScript; the hover box
on the index moves with CSS anchor positioning.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Adding a project

Each project is a Markdown file in `src/content/projects/`. The file name becomes the URL (`/projects/<name>/`) and the
body is the write-up. Frontmatter:

```yaml
---
title: meeseeks
tagline: a crash-safe log-structured key-value store in C
stack: [C11, POSIX, pthreads]
year: 2026
repo: https://github.com/leNITHISH/meeseeks
rank: 1          # position on the home page
accent: '#2e81ee' # this project's color: its index tag, strip and hover box
---
```

Pick an accent with luminance between 0.20 and 0.25, so it reads on the cream page (3:1) and black text reads on it
(4.5:1), and keep its hue away from the other projects' and the site orange. Give the project its own color-strip
recipe in `src/strips.ts` (otherwise it gets the default), and a block in the footer strip there.

The schema is in `src/content.config.ts`, and the links in the header, footer and about page come from `src/links.ts`.
