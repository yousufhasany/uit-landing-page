import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { cn, eventWhen, formatDate, LEVEL_LABELS, PHASE_LABELS } from '@/lib/format';
import type { CampusItem, Center, EventCard, NewsCard, Program, ResearchItem } from '@/lib/types';
import { Badge, Img, StatusBadge } from './ui/primitives';

/** Placeholder artwork for news without a photograph. */
export function NewsPlaceholder({ label, compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className="pattern-lines absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-teal-800 to-ink-900 p-4" aria-hidden>
      <span className="font-serif text-lg text-gold-300/80">UIT</span>
      {!compact && label && <span className="font-serif text-xl text-white/85">{label}</span>}
    </div>
  );
}

export function NewsCardView({ item, featured = false, large = false, dark = false }: { item: NewsCard; featured?: boolean; large?: boolean; dark?: boolean }) {
  return (
    <article className={cn('group relative flex h-full flex-col', featured && 'md:grid md:grid-cols-2 md:gap-8')}>
      <div className={cn('relative overflow-hidden rounded-2xl', featured ? 'aspect-[4/3]' : 'aspect-[16/10]')}>
        {item.image ? (
          <Img media={item.image} sizes={featured || large ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'} className="size-full transition-transform duration-700 group-hover:scale-[1.04]" />
        ) : (
          <NewsPlaceholder label={item.category?.name ?? 'UIT News'} />
        )}
      </div>
      <div className={cn('flex flex-1 flex-col', featured ? 'mt-5 md:mt-0 md:justify-center' : 'mt-5')}>
        <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', dark ? 'text-teal-100/70' : 'text-ink-700/70')}>
          {item.category && <span className={cn('font-semibold tracking-wide uppercase', dark ? 'text-gold-300' : 'text-teal-700')}>{item.category.name}</span>}
          {item.publishedAt && <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>}
        </div>
        <h3 className={cn('mt-2 leading-snug', featured || large ? 'text-2xl sm:text-3xl' : 'text-xl', dark ? 'text-white' : 'text-ink-900')}>
          <Link to={`/news/${item.slug}`} className="after:absolute after:inset-0 hover:underline hover:decoration-ember-400 hover:underline-offset-4">
            {item.title}
          </Link>
        </h3>
        <p className={cn('mt-3 line-clamp-3 text-[0.95rem] leading-relaxed', dark ? 'text-teal-100/75' : 'text-ink-700/80')}>{item.summary}</p>
      </div>
    </article>
  );
}

export function EventCardView({ item }: { item: EventCard }) {
  const start = new Date(item.startsAt);
  return (
    <article className="group relative flex gap-5 rounded-2xl border border-stone-line bg-white p-5 transition hover:shadow-soft">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 py-3 text-teal-800">
        <span className="text-xs font-semibold uppercase">{start.toLocaleString('en-GB', { month: 'short', timeZone: 'Asia/Dhaka' })}</span>
        <span className="font-serif text-2xl leading-none">{start.toLocaleString('en-GB', { day: 'numeric', timeZone: 'Asia/Dhaka' })}</span>
      </div>
      <div className="min-w-0">
        {item.category && <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">{item.category.name}</p>}
        <h3 className="mt-1 text-lg leading-snug">
          <Link to={`/events/${item.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{item.title}</Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-700/75"><CalendarDays className="size-4" aria-hidden />{eventWhen(item.startsAt, item.endsAt, item.isAllDay)}</p>
        {item.venue && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-700/75"><MapPin className="size-4" aria-hidden />{item.venue}</p>}
      </div>
    </article>
  );
}

export function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-stone-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={program.programStatus} label={program.statusLabel} />
        {program.launchPhase && <Badge>{PHASE_LABELS[program.launchPhase] ?? program.launchPhase}</Badge>}
      </div>
      <h3 className="mt-4 text-lg leading-snug">
        <Link to={`/academics/programs/${program.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{program.name}</Link>
      </h3>
      <p className="mt-2 text-sm text-ink-700/70">{LEVEL_LABELS[program.level] ?? program.level} · {program.faculty.shortName ?? program.faculty.name}</p>
      {program.department && <p className="mt-auto pt-4 text-xs text-ink-700/60">{program.department.name}</p>}
    </article>
  );
}

export function CenterCard({ center, dark = false, index }: { center: Center; dark?: boolean; index?: number }) {
  return (
    <article className={cn('group relative flex h-full flex-col overflow-hidden rounded-2xl transition', dark ? 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10' : 'border border-stone-line bg-white hover:shadow-soft')}>
      {center.image && (
        <div className="aspect-[16/9] overflow-hidden">
          <Img media={center.image} sizes="(min-width: 1024px) 33vw, 100vw" className="size-full transition-transform duration-700 group-hover:scale-[1.04]" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <span className={cn('font-serif text-sm', dark ? 'text-gold-300' : 'text-ember-600')}>
            {index !== undefined ? String(index + 1).padStart(2, '0') : center.acronym}
          </span>
          <ArrowUpRight className={cn('size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5', dark ? 'text-teal-100/60' : 'text-ink-700/40')} aria-hidden />
        </div>
        <h3 className={cn('mt-4 text-xl leading-snug', dark ? 'text-white' : 'text-ink-900')}>
          <Link to={`/centers/${center.slug}`} className="after:absolute after:inset-0">{center.name}</Link>
        </h3>
        {center.tagline && <p className={cn('mt-3 line-clamp-3 text-sm leading-relaxed', dark ? 'text-teal-100/75' : 'text-ink-700/75')}>{center.tagline}</p>}
      </div>
    </article>
  );
}

export function ResearchAreaCard({ item, dark = false }: { item: ResearchItem; dark?: boolean }) {
  return (
    <div className={cn('rounded-xl px-4 py-3.5', dark ? 'bg-white/5 ring-1 ring-white/10' : 'border border-stone-line bg-white')}>
      <p className={cn('font-medium leading-snug', dark ? 'text-white' : 'text-ink-900')}>{item.title}</p>
      {item.phase && <p className={cn('mt-1 text-xs', dark ? 'text-teal-100/60' : 'text-ink-700/60')}>{PHASE_LABELS[item.phase] ?? item.phase}</p>}
    </div>
  );
}

export function CampusItemCard({ item }: { item: CampusItem }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-line bg-white">
      {item.image && (
        <div className="aspect-[4/3] overflow-hidden">
          <Img media={item.image} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="size-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <StatusBadge status={item.developmentStatus} label={item.statusLabel} className="self-start" />
        <h3 className="mt-3 text-lg leading-snug">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-700/80">{item.description}</p>
      </div>
    </article>
  );
}
