import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedPosts } from '../utils/posts';
import { getAllEntries, getProjectBySlug, getEntrySlug } from '../utils/projects';

export async function GET(context: APIContext) {
  const posts = await getSortedPosts();
  const entries = await getAllEntries();

  const entryItems = await Promise.all(
    entries.map(async (entry) => {
      const projectSlug = entry.slug.split('/')[0];
      const project = await getProjectBySlug(projectSlug);
      return {
        title: `[${project?.data.title ?? projectSlug}] ${entry.data.title}`,
        description: `${entry.data.category ? entry.data.category + ' — ' : ''}${entry.data.title}`,
        pubDate: entry.data.date,
        link: `/projects/${projectSlug}/${getEntrySlug(entry)}/`,
      };
    })
  );

  const postItems = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.publishedAt,
    link: `/blog/${post.slug}/`,
  }));

  const allItems = [...entryItems, ...postItems].sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
  );

  return rss({
    title: 'Hugo Talledos',
    description: 'Diarios de ingeniería de software — proyectos técnicos, arquitectura y DevOps.',
    site: context.site!,
    items: allItems,
    customData: '<language>es-mx</language>',
  });
}
