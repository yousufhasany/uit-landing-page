/** URL-safe slug. "/" is only kept when `allowSlash` is set (page paths such as "about/history"). */
export function slugify(input: string, allowSlash = false): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(allowSlash ? /[^a-z0-9/]+/g : /[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '');
  return allowSlash ? slug.replace(/\/-|-\//g, '/').replace(/\/{2,}/g, '/').replace(/^\/|\/$/g, '') : slug;
}

/** Returns `base`, or `base-2`, `base-3`… until `exists` reports it is free. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>, allowSlash = false): Promise<string> {
  const root = slugify(base, allowSlash) || 'item';
  let candidate = root;
  for (let n = 2; await exists(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}
