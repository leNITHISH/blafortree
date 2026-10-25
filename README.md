# blafortree

Source for [blafortree.netlify.app](https://blafortree.netlify.app), my portfolio. Built with Astro and styled after
Hacker News. It ships no client-side JavaScript.

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
---
```

The schema is in `src/content.config.ts`, and the links in the header, footer and about page come from `src/links.ts`.
