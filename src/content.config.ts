import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    stack: z.array(z.string()),
    year: z.number(),
    repo: z.url(),
    rank: z.number(),
    // Fill color for this project's tag, strip and hover box. See README.
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});

export const collections = { projects };
