import { CalendarDays, CalendarX, ExternalLink, MapPin } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { EventCardView, NewsCardView } from '@/components/cards';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/ui/Seo';
import { Badge, ButtonLink, EmptyState, Img, RichText, Skeleton } from '@/components/ui/primitives';
import { RiseText } from '@/components/ui/text-motion';
import { ApiError } from '@/lib/api';
import { cn, eventWhen, formatDate } from '@/lib/format';
import { useEvent, useEvents, useNews, useNewsArticle, useNewsCategories } from '@/lib/queries';
import { PageSkeleton } from './CmsPage';
import NotFound from './NotFound';

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-sand disabled:opacity-40">Previous</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn('size-10 rounded-full text-sm font-medium', p === page ? 'bg-ink-900 text-white' : 'hover:bg-sand')}
        >
          {p}
        </button>
      ))}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-sand disabled:opacity-40">Next</button>
    </nav>
  );
}

function Tabs({ items, value, onChange, label }: { items: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn('rounded-full px-4 py-2 text-sm font-medium transition', value === t.value ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-stone-line hover:bg-sand')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function NewsListPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const page = Number(params.get('page') ?? 1);
  const { data: categories } = useNewsCategories();
  const { data, isLoading } = useNews({ category: category || undefined, page, pageSize: 9 });

  const update = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [first, ...rest] = data?.items ?? [];
  const showFeatured = page === 1 && !category && first;

  return (
    <>
      <Seo title="News" description="Official news and milestones from the University of Integrated Thought." />
      <PageHeader eyebrow="Newsroom" title="News from UIT" summary="Official updates on UIT’s establishment, campus and academic planning." crumbs={[{ label: 'News' }]} />
      <PageBody>
        <Tabs
          label="News categories"
          value={category}
          onChange={(v) => update({ category: v, page: '' })}
          items={[{ value: '', label: 'All news' }, ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name }))]}
        />
        {isLoading ? (
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>
        ) : !data?.items.length ? (
          <div className="mt-10"><EmptyState title="No news in this category yet" /></div>
        ) : (
          <>
            {showFeatured && <div className="mt-12 border-b border-stone-line pb-14"><NewsCardView item={first} featured /></div>}
            <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {(showFeatured ? rest : data.items).map((n) => <li key={n.id}><NewsCardView item={n} /></li>)}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => update({ page: String(p) })} />
          </>
        )}
      </PageBody>
    </>
  );
}

export function NewsDetailPage() {
  const { slug = '' } = useParams();
  const { data: a, isLoading, error } = useNewsArticle(slug);
  if (isLoading) return <PageSkeleton />;
  if ((error instanceof ApiError && error.status === 404) || !a) return <NotFound />;

  return (
    <>
      <Seo title={a.seoTitle || a.title} description={a.seoDescription || a.summary} image={a.image} type="article" />
      <article>
        <header className="border-b border-stone-line bg-sand/50">
          <div className="container-x max-w-4xl pt-10 pb-12 md:pt-14">
            <nav aria-label="Breadcrumb" className="text-sm text-ink-700/65">
              <Link to="/news" className="hover:text-teal-800">← All news</Link>
            </nav>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
              {a.category && <Link to={`/news?category=${a.category.slug}`} className="font-semibold tracking-wide text-teal-700 uppercase hover:underline">{a.category.name}</Link>}
              {a.publishedAt && <time dateTime={a.publishedAt} className="text-ink-700/65">{formatDate(a.publishedAt)}</time>}
            </div>
            <RiseText as="h1" text={a.title} className="mt-4 text-4xl leading-[1.1] sm:text-5xl" />
            <p className="mt-5 text-xl leading-relaxed text-ink-700/85">{a.summary}</p>
          </div>
        </header>
        {a.image && (
          <figure className="container-x -mb-4 max-w-5xl pt-10">
            <Img media={a.image} priority sizes="(min-width: 1024px) 1024px, 100vw" className="aspect-[16/9] w-full rounded-3xl" />
            {a.image.caption && <figcaption className="mt-3 text-sm text-ink-700/65">{a.image.caption}</figcaption>}
          </figure>
        )}
        <div className="container-x max-w-3xl py-14">
          <RichText html={a.content} />
          {a.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
              {a.tags.map((t) => <li key={t}><Badge>{t}</Badge></li>)}
            </ul>
          )}
        </div>
      </article>
      {a.related.length > 0 && (
        <section className="border-t border-stone-line bg-white py-16">
          <div className="container-x">
            <h2 className="text-3xl">Related news</h2>
            <ul className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {a.related.map((n) => <li key={n.id}><NewsCardView item={n} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

export function EventsListPage() {
  const [params, setParams] = useSearchParams();
  const when = params.get('when') === 'past' ? 'past' : 'upcoming';
  const page = Number(params.get('page') ?? 1);
  const { data, isLoading } = useEvents({ when, page, pageSize: 10 });

  return (
    <>
      <Seo title="Events" description="Events at the University of Integrated Thought." />
      <PageHeader eyebrow="Events" title="Events" summary="Seminars, ceremonies and public events, as they are confirmed." crumbs={[{ label: 'Events' }]} />
      <PageBody>
        <Tabs label="Event timeframe" value={when} onChange={(v) => setParams(v === 'past' ? { when: 'past' } : {})} items={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : !data?.items.length ? (
          <div className="mt-10">
            <EmptyState
              icon={<CalendarX className="size-5" />}
              title={when === 'upcoming' ? 'No upcoming events have been announced' : 'No past events yet'}
              text={when === 'upcoming' ? 'Confirmed events will be published here. For institutional updates, see the newsroom.' : undefined}
              action={<ButtonLink to="/news" style="secondary">Read the latest news</ButtonLink>}
            />
          </div>
        ) : (
          <>
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {data.items.map((e) => <li key={e.id}><EventCardView item={e} /></li>)}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => setParams({ ...(when === 'past' ? { when } : {}), page: String(p) })} />
          </>
        )}
      </PageBody>
    </>
  );
}

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const { data: e, isLoading, error } = useEvent(slug);
  if (isLoading) return <PageSkeleton />;
  if ((error instanceof ApiError && error.status === 404) || !e) return <NotFound />;
  const isPast = new Date(e.endsAt ?? e.startsAt) < new Date();

  return (
    <>
      <Seo title={e.seoTitle || e.title} description={e.seoDescription || e.summary} image={e.image} />
      <PageHeader eyebrow={e.category?.name ?? 'Event'} title={e.title} summary={e.summary} crumbs={[{ label: 'Events', to: '/events' }, { label: e.title }]} image={e.image} />
      <PageBody className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8"><RichText html={e.description} /></div>
        <aside className="lg:col-span-4">
          <div className="space-y-4 rounded-3xl border border-stone-line bg-white p-6">
            {isPast && <Badge>This event has ended</Badge>}
            <p className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />{eventWhen(e.startsAt, e.endsAt, e.isAllDay)}</p>
            {e.venue && <p className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />{e.venue}</p>}
            {e.registrationUrl && !isPast && (
              <a href={e.registrationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ember-500 px-5 py-3 text-sm font-semibold text-white hover:bg-ember-600">
                Register <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </aside>
      </PageBody>
    </>
  );
}
