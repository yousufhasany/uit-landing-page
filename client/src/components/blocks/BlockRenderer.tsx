import { ArrowUpRight, CalendarX, FileText, FlaskConical, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { cn, formatDate, PHASE_LABELS } from '@/lib/format';
import { useCampus, useCenters, useContacts, useEvents, useFaculties, useGalleries, useNews, usePrograms, useResearch } from '@/lib/queries';
import type { Media, PageBlock } from '@/lib/types';
import { CampusItemCard, CenterCard, EventCardView, NewsCardView, ProgramCard, ResearchAreaCard } from '../cards';
import { contactHref } from '../layout/Footer';
import { Buttons, EmptyState, Img, Reveal, RichText, Skeleton } from '../ui/primitives';
import { RiseText } from '../ui/text-motion';

type BlockProps = { block: PageBlock; media: Record<string, Media | null> };

function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-40" />)}
    </div>
  );
}

function BlockTitle({ title, intro }: { title?: string; intro?: string }) {
  if (!title && !intro) return null;
  return (
    <div className="mb-8 max-w-3xl">
      {title && <RiseText as="h2" text={title} className="text-3xl leading-tight" />}
      {intro && <p className="mt-3 text-lg leading-relaxed text-ink-700/80">{intro}</p>}
    </div>
  );
}

// ───────────────────────────── Dynamic modules ─────────────────────────────

function ProgramsModule({ limit }: { limit: number }) {
  const { data, isLoading } = usePrograms({ pageSize: limit });
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState title="No programs published yet" />;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((p) => <li key={p.id}><ProgramCard program={p} /></li>)}
    </ul>
  );
}

function FacultiesModule() {
  const { data, isLoading } = useFaculties();
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState title="No schools published yet" />;
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {data.items.map((f) => (
        <li key={f.id} className="group relative rounded-3xl border border-stone-line bg-white p-7 transition hover:shadow-soft">
          <div className="flex items-center justify-between text-xs text-ink-700/60">
            <span className="rounded-full bg-teal-50 px-2.5 py-1 font-semibold text-teal-800">{f.shortName}</span>
            <span>{f.programCount} proposed programs</span>
          </div>
          <h3 className="mt-5 text-2xl">
            <Link to={`/academics/programs?faculty=${f.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{f.name}</Link>
          </h3>
          {f.description && <p className="mt-3 leading-relaxed text-ink-700/80">{f.description}</p>}
          {f.departments.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {f.departments.map((d) => <li key={d.id} className="rounded-full bg-sand px-3 py-1 text-xs text-ink-700">{d.name.replace(/^Department of /, '')}</li>)}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function CentersModule() {
  const { data, isLoading } = useCenters();
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState title="No centers published yet" />;
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {data.items.map((c, i) => <li key={c.id}><CenterCard center={c} index={i} /></li>)}
    </ul>
  );
}

function ResearchAreasModule({ limit }: { limit: number }) {
  const { data, isLoading } = useResearch({ type: 'AREA', pageSize: limit });
  if (isLoading) return <GridSkeleton count={6} />;
  const items = data?.items ?? [];
  if (!items.length) return <EmptyState title="No research areas published yet" />;
  const groups = Object.entries(
    items.reduce<Record<string, typeof items>>((acc, item) => {
      (acc[item.phase ?? 'OTHER'] ??= []).push(item);
      return acc;
    }, {}),
  );
  return (
    <div className="space-y-10">
      {groups.map(([phase, list]) => (
        <div key={phase}>
          <h3 className="text-sm font-semibold tracking-[0.16em] text-teal-700 uppercase">{PHASE_LABELS[phase] ?? 'Other areas'}</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((a) => <li key={a.id}><ResearchAreaCard item={a} /></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ResearchListModule({ type, limit, emptyTitle, emptyText }: { type: 'PROJECT' | 'PUBLICATION'; limit: number; emptyTitle: string; emptyText: string }) {
  const { data, isLoading } = useResearch({ type, pageSize: limit });
  if (isLoading) return <GridSkeleton />;
  const items = data?.items ?? [];
  if (!items.length) return <EmptyState icon={type === 'PROJECT' ? <FlaskConical className="size-5" /> : <FileText className="size-5" />} title={emptyTitle} text={emptyText} />;
  return (
    <ul className="divide-y divide-stone-line border-y border-stone-line">
      {items.map((r) => (
        <li key={r.id} className="py-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-700/60">
            {r.center && <span className="font-semibold text-teal-700">{r.center.acronym ?? r.center.name}</span>}
            {r.phase && <span>{PHASE_LABELS[r.phase] ?? r.phase}</span>}
          </div>
          <h3 className="mt-1 text-xl">
            {r.externalUrl ? (
              <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-teal-800">{r.title}<ArrowUpRight className="size-4" aria-hidden /></a>
            ) : r.title}
          </h3>
          <p className="mt-2 leading-relaxed text-ink-700/80">{r.summary}</p>
        </li>
      ))}
    </ul>
  );
}

function NewsModule({ limit, category }: { limit: number; category?: string }) {
  const { data, isLoading } = useNews({ pageSize: limit, category: category || undefined });
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState title="No news published yet" />;
  return (
    <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((n) => <li key={n.id}><NewsCardView item={n} /></li>)}
    </ul>
  );
}

function MilestonesModule({ limit, category }: { limit: number; category?: string }) {
  const { data, isLoading } = useNews({ pageSize: limit, category: category || undefined });
  if (isLoading) return <Skeleton className="h-64" />;
  const items = [...(data?.items ?? [])].reverse();
  if (!items.length) return <EmptyState title="No milestones published yet" />;
  return <Timeline items={items.map((n) => ({ date: formatDate(n.publishedAt), title: n.title, text: n.summary, url: `/news/${n.slug}` }))} />;
}

function EventsModule({ limit }: { limit: number }) {
  const { data, isLoading } = useEvents({ pageSize: limit, when: 'upcoming' });
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<CalendarX className="size-5" />} title="No upcoming events" text="Events will be announced here once they are confirmed." />;
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {data.items.map((e) => <li key={e.id}><EventCardView item={e} /></li>)}
    </ul>
  );
}

function CampusModule({ category }: { category?: string }) {
  const { data, isLoading } = useCampus(category || undefined);
  if (isLoading) return <GridSkeleton />;
  if (!data?.items.length) return <EmptyState title="No campus information published yet" />;
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((c) => <li key={c.id}><CampusItemCard item={c} /></li>)}
    </ul>
  );
}

function GalleryAlbumsModule() {
  const { data, isLoading } = useGalleries();
  if (isLoading) return <GridSkeleton />;
  if (!data?.length) return <EmptyState title="No albums published yet" />;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((g) => (
        <li key={g.id} className="group relative">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl">
            <Img media={g.cover} sizes="(min-width: 1024px) 33vw, 50vw" className="size-full transition-transform duration-700 group-hover:scale-[1.04]" />
          </div>
          <h3 className="mt-4 text-xl"><Link to={`/campus/gallery/${g.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{g.title}</Link></h3>
          <p className="mt-1 text-sm text-ink-700/65">{g.itemCount} photos</p>
        </li>
      ))}
    </ul>
  );
}

const CONTACT_ICON = { ADDRESS: MapPin, PHONE: Phone, EMAIL: Mail, WEBSITE: Globe, HOURS: Globe } as const;

function ContactModule() {
  const { data, isLoading } = useContacts();
  if (isLoading) return <GridSkeleton count={4} />;
  const items = data?.items ?? [];
  if (!items.length) return <EmptyState title="Contact details will be published soon" />;
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {items.map((c) => {
        const Icon = CONTACT_ICON[c.type] ?? Globe;
        const href = contactHref(c.type, c.value);
        return (
          <li key={c.id} className="flex gap-4 rounded-2xl border border-stone-line bg-white p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-sm text-ink-700/65">{c.label}</p>
              {href ? (
                <a href={href} className="mt-1 block font-medium break-words text-ink-900 hover:text-teal-800" {...(c.type === 'WEBSITE' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.value}</a>
              ) : (
                <p className="mt-1 font-medium whitespace-pre-line text-ink-900">{c.value}</p>
              )}
              {c.description && <p className="mt-2 text-sm text-ink-700/70">{c.description}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DynamicBlock({ data }: { data: Record<string, any> }) {
  const limit = Number(data.limit ?? 12);
  const body = (() => {
    switch (data.module) {
      case 'programs': return <ProgramsModule limit={limit} />;
      case 'faculties': return <FacultiesModule />;
      case 'centers': return <CentersModule />;
      case 'research-areas': return <ResearchAreasModule limit={limit} />;
      case 'research-projects': return <ResearchListModule type="PROJECT" limit={limit} emptyTitle="No research projects yet" emptyText="Research projects will be listed here once they begin." />;
      case 'publications': return <ResearchListModule type="PUBLICATION" limit={limit} emptyTitle="No publications yet" emptyText="Publications will be listed here once they are released." />;
      case 'news': return <NewsModule limit={limit} category={data.category} />;
      case 'timeline-milestones': return <MilestonesModule limit={limit} category={data.category} />;
      case 'events': return <EventsModule limit={limit} />;
      case 'campus': return <CampusModule category={data.category} />;
      case 'gallery-albums': return <GalleryAlbumsModule />;
      case 'contact': return <ContactModule />;
      default: return null;
    }
  })();
  return (
    <div>
      <BlockTitle title={data.title} intro={data.intro} />
      {body}
    </div>
  );
}

// ───────────────────────────── Static blocks ─────────────────────────────

export function Timeline({ items }: { items: { date: string; title: string; text?: string; url?: string }[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-teal-100">
      {items.map((it, i) => (
        <li key={i} className="relative pb-10 pl-8 last:pb-0">
          <span className="absolute top-1.5 -left-[0.5625rem] size-4 rounded-full border-4 border-ivory bg-ember-500" aria-hidden />
          <p className="text-xs font-semibold tracking-wide text-ember-700 uppercase">{it.date}</p>
          <h3 className="mt-1 text-xl leading-snug">{it.url ? <Link to={it.url} className="hover:text-teal-800">{it.title}</Link> : it.title}</h3>
          {it.text && <p className="mt-2 leading-relaxed text-ink-700/80">{it.text}</p>}
        </li>
      ))}
    </ol>
  );
}

function Block({ block, media }: BlockProps) {
  const d = block.data;
  switch (block.type) {
    case 'HEADING': {
      const Tag = d.level === 3 ? 'h3' : 'h2';
      return (
        <div className="max-w-3xl">
          {d.eyebrow && <p className="eyebrow">{d.eyebrow}</p>}
          <Tag className={cn('mt-2 leading-tight', d.level === 3 ? 'text-2xl' : 'text-3xl sm:text-4xl')}>{d.text}</Tag>
        </div>
      );
    }
    case 'RICH_TEXT':
      return d.html ? <RichText html={d.html} className="max-w-3xl" /> : null;
    case 'IMAGE': {
      const m = d.mediaId ? media[d.mediaId] : null;
      if (!m) return null;
      return (
        <figure className={cn(d.size === 'inline' && 'max-w-3xl', d.size === 'full' && 'lg:-mx-8')}>
          <Img media={m} sizes={d.size === 'inline' ? '(min-width: 768px) 768px, 100vw' : '100vw'} className="w-full rounded-3xl" />
          {(d.caption || m.caption) && <figcaption className="mt-3 text-sm text-ink-700/65">{d.caption || m.caption}</figcaption>}
        </figure>
      );
    }
    case 'CTA':
      return (
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-8 text-white md:p-12">
          <div className="pattern-lines absolute inset-0" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              {d.title && <h2 className="text-3xl text-white">{d.title}</h2>}
              {d.text && <p className="mt-3 text-teal-100/80">{d.text}</p>}
            </div>
            <Buttons buttons={d.buttons} dark className="text-white" />
          </div>
        </div>
      );
    case 'QUOTE':
      return (
        <blockquote className="max-w-3xl border-l-4 border-gold-400 pl-6">
          <p className="font-serif text-2xl leading-snug text-ink-900 sm:text-3xl">“{d.text}”</p>
          {d.attribution && <footer className="mt-4 text-sm text-ink-700/70">{d.attribution}</footer>}
        </blockquote>
      );
    case 'CARD_GRID': {
      const cols = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[d.columns as 2 | 3 | 4] ?? 'md:grid-cols-3';
      const people = d.variant === 'people';
      const profile = people && d.columns === 2;
      return (
        <div>
          <BlockTitle title={d.title} intro={d.intro} />
          <ul className={cn('grid gap-5', cols, profile && 'mx-auto max-w-5xl')}>
            {(d.cards ?? []).map((c: { title: string; text?: string; url?: string; badge?: string; imageId?: string }, i: number) => {
              const img = c.imageId ? media[c.imageId] : null;
              if (people) {
                return (
                  <li key={i} className={cn('flex flex-col overflow-hidden rounded-3xl border border-stone-line bg-white', profile && 'sm:flex-row')}>
                    {img && (
                      <div className={cn('overflow-hidden bg-sand', profile ? 'aspect-[4/5] sm:aspect-auto sm:w-52 sm:shrink-0' : 'aspect-[3/4]')}>
                        <Img media={img} alt={c.title} sizes={profile ? '208px' : '(min-width: 1024px) 25vw, 50vw'} className="size-full object-top" />
                      </div>
                    )}
                    <div className={cn('flex flex-1 flex-col', profile ? 'justify-center p-6 sm:p-8' : 'p-5')}>
                      {c.badge && <p className="text-xs font-semibold tracking-[0.14em] text-teal-700 uppercase">{c.badge}</p>}
                      <h3 className={cn('font-serif leading-snug', profile ? 'text-xl' : 'text-lg', c.badge && 'mt-2')}>{c.title}</h3>
                      {c.text && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700/80">{c.text}</p>}
                    </div>
                  </li>
                );
              }
              return (
                <li key={i} className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-line bg-white transition hover:shadow-soft">
                  {img && <div className="aspect-[16/10] overflow-hidden"><Img media={img} sizes="(min-width: 1024px) 33vw, 100vw" className="size-full" /></div>}
                  <div className="flex flex-1 flex-col p-6">
                    {c.badge && <span className="self-start rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-600">{c.badge}</span>}
                    <h3 className={cn('text-xl leading-snug', c.badge && 'mt-3')}>
                      {c.url ? <Link to={c.url} className="after:absolute after:inset-0 group-hover:text-teal-800">{c.title}</Link> : c.title}
                    </h3>
                    {c.text && <p className="mt-2 leading-relaxed whitespace-pre-line text-ink-700/80">{c.text}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    case 'TIMELINE':
      return (
        <div className="max-w-3xl">
          <BlockTitle title={d.title} />
          <Timeline items={d.items ?? []} />
        </div>
      );
    case 'STATS':
      return (
        <div>
          <dl className="grid gap-px overflow-hidden rounded-3xl bg-stone-line sm:grid-cols-2 lg:grid-cols-4">
            {(d.items ?? []).map((s: { value: string; label: string; note?: string }, i: number) => (
              <div key={i} className="flex flex-col bg-white p-7">
                <dt className="order-2 mt-2 font-medium">{s.label}</dt>
                <dd className="order-1 font-serif text-4xl text-teal-800">{s.value}</dd>
                {s.note && <dd className="order-3 mt-1 text-sm text-ink-700/65">{s.note}</dd>}
              </div>
            ))}
          </dl>
          {d.sourceNote && <p className="mt-4 text-sm text-ink-700/60">{d.sourceNote}</p>}
        </div>
      );
    case 'DYNAMIC':
      return <DynamicBlock data={d} />;
    default:
      return null;
  }
}

export function BlockRenderer({ blocks, media }: { blocks: PageBlock[]; media: Record<string, Media | null> }) {
  return (
    <div className="space-y-14 md:space-y-20">
      {blocks.map((b) => (
        <Reveal key={b.id}>
          <Block block={b} media={media} />
        </Reveal>
      ))}
    </div>
  );
}
