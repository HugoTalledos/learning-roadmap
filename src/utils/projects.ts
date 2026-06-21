import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function getAllProjects() {
  return getCollection('projects');
}

export async function getFeaturedProjects() {
  const projects = await getAllProjects();
  return projects.filter((p) => p.data.featured);
}

export async function getProjectBySlug(slug: string) {
  const projects = await getAllProjects();
  return projects.find((p) => p.slug === slug);
}

export async function getEntriesForProject(projectSlug: string) {
  const all = await getCollection('entries', ({ data, slug }) => {
    return !data.draft && slug.startsWith(projectSlug + '/');
  });
  return all.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
}

export async function getAllEntries() {
  return getCollection('entries', ({ data }) => !data.draft);
}

export function getEntrySlug(entry: CollectionEntry<'entries'>): string {
  return entry.slug.split('/').slice(1).join('/');
}

export function getProjectSlugFromEntry(entry: CollectionEntry<'entries'>): string {
  return entry.slug.split('/')[0];
}
