import { getCollection } from 'astro:content';

export async function getSortedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );
}

export async function getAllTags() {
  const posts = await getSortedPosts();
  const tagSet = new Set(posts.flatMap((p) => p.data.tags.map((t) => t.toLowerCase())));
  return [...tagSet].sort();
}

export async function getPostsByTag(tag: string) {
  const posts = await getSortedPosts();
  return posts.filter((p) =>
    p.data.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}
