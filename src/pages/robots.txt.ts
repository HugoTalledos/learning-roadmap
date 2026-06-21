import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString() ?? '';
  const content = `User-agent: *
Allow: /

Sitemap: ${siteUrl}sitemap-index.xml
`;
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
