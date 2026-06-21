import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).min(1),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    projectStatus: z.enum(['idea', 'wip', 'completed', 'archived']).optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['idea', 'wip', 'completed', 'archived']),
    repository: z.string().optional(),
    demoUrl: z.string().optional(),
    startedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    coverImage: z.string().optional(),
    technologies: z.array(z.string()),
    featured: z.boolean().default(false),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  }),
});

const entries = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    project: z.string(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects, entries };
