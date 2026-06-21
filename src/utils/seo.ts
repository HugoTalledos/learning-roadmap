export function formatDate(date: Date, locale = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}
