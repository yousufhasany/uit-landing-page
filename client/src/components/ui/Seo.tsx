import { useLocation } from 'react-router';
import { useSite } from '@/lib/queries';
import type { Media } from '@/lib/types';

/** React 19 hoists these tags into <head>. */
export function Seo({ title, description, image, type = 'website', noindex = false }: { title?: string | null; description?: string | null; image?: Media | null; type?: string; noindex?: boolean }) {
  const { data: site } = useSite();
  const { pathname } = useLocation();
  const seo = site?.seo;
  const fullTitle = title ? (seo?.titleTemplate ?? '%s | UIT').replace('%s', title) : seo?.defaultTitle || 'University of Integrated Thought';
  const desc = description || seo?.defaultDescription || '';
  const og = image ?? seo?.ogImage ?? null;
  const base = (seo?.siteUrl || window.location.origin).replace(/\/$/, '');
  return (
    <>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={`${base}${pathname}`} />
      <meta property="og:site_name" content={site?.identity.name ?? 'University of Integrated Thought'} />
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={`${base}${pathname}`} />
      {og && <meta property="og:image" content={og.url} />}
      <meta name="twitter:card" content={og ? 'summary_large_image' : 'summary'} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
}
