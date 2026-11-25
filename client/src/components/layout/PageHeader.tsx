import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/format';
import { useSite } from '@/lib/queries';
import type { Media } from '@/lib/types';
import { Img } from '../ui/primitives';
import { RiseText } from '../ui/text-motion';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, dark = false }: { items: Crumb[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn('flex flex-wrap items-center gap-1.5 text-sm', dark ? 'text-teal-100/70' : 'text-ink-700/65')}>
        {[{ label: 'Home', to: '/' }, ...items].map((c, i, all) => (
          <li key={i} className="flex items-center gap-1.5">
            {c.to && i < all.length - 1 ? <Link to={c.to} className={dark ? 'hover:text-white' : 'hover:text-teal-800'}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            {i < all.length - 1 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const SECTION_LABELS: Record<string, string> = {
  about: 'About', academics: 'Academics', research: 'Research', centers: 'Centers', campus: 'Campus', news: 'News', events: 'Events',
};

/** Breadcrumb trail for a CMS page slug such as "campus/temporary-campus". */
export function crumbsForSlug(slug: string, title: string): Crumb[] {
  const parts = slug.split('/');
  const crumbs: Crumb[] = [];
  if (parts.length > 1) crumbs.push({ label: SECTION_LABELS[parts[0]] ?? parts[0], to: `/${parts[0]}` });
  crumbs.push({ label: title });
  return crumbs;
}

/** Sibling links from the header menu for the current section, e.g. all "About" pages. */
function SectionNav() {
  const { data: site } = useSite();
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  const root = `/${path.split('/')[1]}`;
  const parent = site?.menus.header?.items.find((n) => n.children.some((c) => c.url === path)) ?? site?.menus.header?.items.find((n) => n.url === root);
  if (!parent || parent.children.length < 2) return null;
  const links = parent.children.some((c) => c.url === parent.url) ? parent.children : [{ ...parent, label: 'Overview', children: [] }, ...parent.children];
  return (
    <nav aria-label={`${parent.label} section`} className="border-b border-stone-line bg-white">
      <ul className="container-x flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
        {links.map((l) => (
          <li key={l.id} className="shrink-0">
            <NavLink
              to={l.url}
              end
              className={({ isActive }) => cn('block rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition', isActive ? 'bg-teal-50 text-teal-800' : 'text-ink-700 hover:bg-sand')}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageHeader(props: { eyebrow?: string | null; title: string; summary?: string | null; crumbs: Crumb[]; image?: Media | null; children?: ReactNode }) {
  return (
    <>
      <PageHeaderInner {...props} />
      <SectionNav />
    </>
  );
}

function PageHeaderInner({
  eyebrow, title, summary, crumbs, image, children,
}: { eyebrow?: string | null; title: string; summary?: string | null; crumbs: Crumb[]; image?: Media | null; children?: ReactNode }) {
  if (image) {
    return (
      <header className="relative isolate overflow-hidden bg-ink-950">
        <Img media={image} priority sizes="100vw" alt="" className="absolute inset-0 -z-10 size-full opacity-55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" aria-hidden />
        <div className="container-x pt-14 pb-16 md:pt-20 md:pb-24">
          <Breadcrumbs items={crumbs} dark />
          <div className="mt-14 max-w-3xl md:mt-24">
            {eyebrow && <p className="eyebrow text-gold-300!">{eyebrow}</p>}
            <RiseText as="h1" text={title} className="mt-3 text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl" />
            {summary && <p className="mt-5 text-lg leading-relaxed text-teal-50/85 sm:text-xl">{summary}</p>}
            {children}
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="relative overflow-hidden border-b border-stone-line bg-sand/50">
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-gold-200/40 blur-3xl" aria-hidden />
      <div className="container-x relative pt-10 pb-14 md:pt-14 md:pb-20">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 max-w-3xl md:mt-14">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <RiseText as="h1" text={title} className="mt-3 text-4xl leading-[1.08] text-ink-900 sm:text-5xl" />
          {summary && <p className="mt-5 text-lg leading-relaxed text-ink-700/85 sm:text-xl">{summary}</p>}
          {children}
        </div>
      </div>
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('container-x py-14 md:py-20', className)}>{children}</div>;
}
