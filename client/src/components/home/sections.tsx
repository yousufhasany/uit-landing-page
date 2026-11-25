import { BookOpen, Building2, Check, GraduationCap, Landmark, Plus, Quote } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/format';
import type { Announcement, Center, EventCard, Faculty, GalleryItem, HomeSection, Media, NewsCard, ResearchItem } from '@/lib/types';
import { AnnouncementBar } from '../layout/PublicLayout';
import { CenterCard, EventCardView, NewsCardView, NewsPlaceholder, ResearchAreaCard } from '../cards';
import { Lightbox } from '../ui/Lightbox';
import { Buttons, Img, Reveal, SectionHeading, StatusBadge } from '../ui/primitives';
import { RiseText } from '../ui/text-motion';

type Props = { section: HomeSection };
const media = (s: HomeSection, key: string): Media | null => (s.data[key] ? s.media[s.data[key]] ?? null : null);

function Shell({ children, className, id, dark = false }: { children: ReactNode; className?: string; id?: string; dark?: boolean }) {
  return (
    <section id={id} className={cn('relative py-20 md:py-28', dark && 'bg-ink-900 text-teal-50', className)}>
      {children}
    </section>
  );
}

function Header({ s, dark = false, align = 'left', action }: { s: HomeSection; dark?: boolean; align?: 'left' | 'center'; action?: boolean }) {
  return (
    <Reveal>
      <SectionHeading
        eyebrow={s.data.eyebrow}
        title={s.data.title}
        description={s.data.description}
        dark={dark}
        align={align}
        action={action ? <Buttons buttons={s.data.buttons} dark={dark} className="shrink-0" /> : undefined}
      />
    </Reveal>
  );
}

type Slide = { media: Media; caption: string };

function heroSlides(s: HomeSection, fallback: Media | null): Slide[] {
  const listed = (s.data.slides ?? [])
    .map((slide: { imageId?: string | null; caption?: string }) => ({
      media: slide.imageId ? s.media[slide.imageId] ?? null : null,
      caption: slide.caption || '',
    }))
    .filter((slide: { media: Media | null }): slide is Slide => Boolean(slide.media));
  if (listed.length) return listed;
  return fallback ? [{ media: fallback, caption: s.data.caption || '' }] : [];
}

/** Photographs that slide left every 3 seconds, with the next one entering from the right. */
function BannerPhotos({ slides, focal, className, onIndex }: { slides: Slide[]; focal: { x: number; y: number }; className?: string; onIndex?: (index: number) => void }) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const looping = slides.length > 1;
  // The first photo is repeated at the end so the loop can keep moving left, then snap back unseen.
  const frames = looping ? [...slides, slides[0]] : slides;

  useEffect(() => {
    if (!looping) return;
    const timer = window.setInterval(() => setIndex((current) => current + 1), 3000);
    return () => window.clearInterval(timer);
  }, [looping]);

  useEffect(() => {
    if (!slides.length) return;
    if (index < slides.length) {
      onIndex?.(index);
      return;
    }
    onIndex?.(0);
    const reset = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, 720);
    return () => window.clearTimeout(reset);
  }, [index, slides.length, onIndex]);

  useEffect(() => {
    if (animate) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  const position = Math.min(index, Math.max(frames.length - 1, 0));

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn('flex h-full w-full', animate && 'transition-transform duration-700 ease-out')}
        style={{ transform: `translateX(-${position * 100}%)` }}
      >
        {frames.map((slide, i) => (
          <div key={`${slide.media.id}-${i}`} className="relative h-full w-full shrink-0">
            <Img media={slide.media} priority alt="" focal={focal} sizes="100vw" className="banner-photo absolute inset-0 size-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────── Hero ─────────────────────────────

function Hero({ section: s }: Props) {
  const image = media(s, 'imageId');
  const focal = { x: s.data.focalX ?? 50, y: s.data.focalY ?? 50 };
  const slides = heroSlides(s, image);
  const [index, setIndex] = useState(0);
  const active = slides[slides.length ? index % slides.length : 0];

  if (s.variant === 'split') {
    return (
      <section className="relative overflow-hidden bg-ivory">
        <div className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            {s.data.eyebrow && <p className="eyebrow">{s.data.eyebrow}</p>}
            <RiseText as="h1" text={s.data.title} className="mt-4 text-4xl leading-[1.08] text-ink-900 sm:text-5xl lg:text-6xl" />
            {s.data.subtitle && <p className="mt-4 text-xl text-teal-800">{s.data.subtitle}</p>}
            {s.data.description && <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700/85">{s.data.description}</p>}
            <Buttons buttons={s.data.buttons} className="mt-9" />
          </div>
          <figure className="relative">
            <div className="absolute -top-5 -right-5 hidden h-2/3 w-2/3 rounded-3xl bg-ember-500/15 lg:block" aria-hidden />
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lift">
              <BannerPhotos slides={slides} focal={focal} onIndex={setIndex} />
            </div>
            {active?.caption && <figcaption className="mt-3 text-sm text-ink-700/70" aria-live="polite">{active.caption}</figcaption>}
          </figure>
        </div>
      </section>
    );
  }

  const centered = s.variant === 'centered' || s.data.align === 'center';
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 md:flex md:min-h-[86vh] md:items-end">
      {s.data.videoUrl ? (
        <video className="absolute inset-0 -z-10 size-full object-cover" src={s.data.videoUrl} poster={image?.url} autoPlay muted loop playsInline aria-hidden />
      ) : (
        <div className="relative aspect-[4/3] w-full bg-ink-950 md:absolute md:inset-0 md:-z-10 md:aspect-auto">
          <BannerPhotos slides={slides} focal={focal} onIndex={setIndex} />
        </div>
      )}
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10 md:block" style={{ opacity: Math.min(1, (s.data.overlay ?? 55) / 60) }} aria-hidden />
      <div className="absolute inset-y-0 left-0 -z-10 hidden w-2/3 bg-gradient-to-r from-ink-950/70 to-transparent md:block" aria-hidden />
      <div className={cn('container-x w-full py-8 md:pt-32 md:pb-20', centered && 'text-center')}>
        <div className={cn('max-w-3xl animate-fade-up', centered && 'mx-auto')}>
          {s.data.eyebrow && <p className="eyebrow text-gold-300!">{s.data.eyebrow}</p>}
          <RiseText as="h1" text={s.data.title} className="mt-4 text-4xl leading-[1.06] text-white sm:text-5xl lg:text-[4.25rem]" />
          {s.data.subtitle && <p className="mt-4 text-xl text-gold-100">{s.data.subtitle}</p>}
          {s.data.description && <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed text-teal-50/85', centered && 'mx-auto')}>{s.data.description}</p>}
          <Buttons buttons={s.data.buttons} dark className={cn('mt-9 text-white', centered && 'justify-center')} />
        </div>
        {active?.caption && <p className="mt-12 text-right text-xs text-teal-50/60" aria-live="polite">{active.caption}</p>}
      </div>
    </section>
  );
}

// ───────────────────────────── About ─────────────────────────────

function About({ section: s }: Props) {
  const image = media(s, 'imageId');
  const imageLeft = s.variant === 'image-left';
  return (
    <Shell>
      <div className="container-x grid items-center gap-14 lg:grid-cols-12">
        <Reveal className={cn('lg:col-span-6', imageLeft ? 'lg:order-1' : 'lg:order-2')}>
          <div className="relative">
            <div className="absolute -bottom-6 -left-6 hidden size-40 rounded-3xl bg-gold-200/60 md:block" aria-hidden />
            <Img media={image} sizes="(min-width: 1024px) 50vw, 100vw" className="relative aspect-[5/4] w-full rounded-3xl shadow-soft" />
            {image?.caption && <p className="mt-3 text-sm text-ink-700/60">{image.caption}</p>}
          </div>
        </Reveal>
        <div className={cn('lg:col-span-6', imageLeft ? 'lg:order-2' : 'lg:order-1')}>
          <Header s={s} />
          {s.data.body && (
            <Reveal delay={0.05}>
              <p className="mt-6 text-lg leading-relaxed text-ink-700/85">{s.data.body}</p>
            </Reveal>
          )}
          {s.data.highlights?.length > 0 && (
            <ul className="mt-8 space-y-4">
              {s.data.highlights.map((h: { title: string; text: string }, i: number) => (
                <Reveal key={i} delay={0.05 * i}>
                  <li className="flex gap-4 rounded-2xl border border-stone-line bg-white p-4">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Check className="size-4" aria-hidden /></span>
                    <span>
                      <span className="block font-semibold text-ink-900">{h.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-700/80">{h.text}</span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          )}
          <Buttons buttons={s.data.buttons} className="mt-8" />
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────────── Statistics ─────────────────────────────

function Statistics({ section: s }: Props) {
  const dark = s.variant === 'dark';
  const items: { value: string; label: string; note?: string }[] = s.data.items ?? [];
  if (!items.length) return null;
  return (
    <Shell dark={dark} className={cn('overflow-hidden', !dark && 'bg-sand/60')}>
      {dark && <div className="pattern-lines absolute inset-0" aria-hidden />}
      <div className="container-x relative">
        <Header s={s} dark={dark} />
        <dl className={cn('mt-14 grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2', items.length >= 4 && 'lg:grid-cols-4', dark ? 'bg-white/10' : 'bg-stone-line')}>
          {items.map((it, i) => (
            <Reveal key={i} delay={0.06 * i} className={cn('flex flex-col p-8', dark ? 'bg-ink-900' : 'bg-ivory')}>
              <dt className="order-2 mt-3 font-medium">{it.label}</dt>
              <dd className={cn('order-1 font-serif text-5xl leading-none lg:text-6xl', dark ? 'text-gold-300' : 'text-teal-800')}>{it.value}</dd>
              {it.note && <dd className={cn('order-3 mt-2 text-sm', dark ? 'text-teal-100/60' : 'text-ink-700/65')}>{it.note}</dd>}
            </Reveal>
          ))}
        </dl>
        {s.data.sourceNote && <p className={cn('mt-6 text-sm', dark ? 'text-teal-100/55' : 'text-ink-700/60')}>{s.data.sourceNote}</p>}
      </div>
    </Shell>
  );
}

// ───────────────────────────── Vision / Mission ─────────────────────────────

function Vision({ section: s }: Props) {
  const items: { text: string }[] = s.data.items ?? [];
  return (
    <Shell className={s.variant === 'light' ? 'bg-white' : 'bg-ivory'}>
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Header s={s} />
          <Quote className="mt-8 hidden size-16 text-gold-300 lg:block" aria-hidden />
        </div>
        <ol className="space-y-px lg:col-span-8">
          {items.map((it, i) => (
            <Reveal key={i} delay={0.06 * i}>
              <li className="flex gap-6 border-t border-stone-line py-7 first:border-t-0 first:pt-0 lg:first:pt-2">
                <span className="font-serif text-lg text-ember-500">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-serif text-2xl leading-snug text-ink-900 sm:text-[1.75rem]">{it.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </Shell>
  );
}

function Mission({ section: s }: Props) {
  const dark = s.variant === 'dark';
  const items: { text: string }[] = s.data.items ?? [];
  const icons = [Landmark, GraduationCap, BookOpen, Building2];
  return (
    <Shell dark={dark} className={cn('overflow-hidden', !dark && 'bg-sand/50')}>
      {dark && <div className="absolute -top-40 -right-40 size-[32rem] rounded-full bg-teal-700/30 blur-3xl" aria-hidden />}
      <div className="container-x relative">
        <Header s={s} dark={dark} align="center" />
        <ul className={cn('mt-14 grid gap-6', items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
          {items.map((it, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={i} delay={0.08 * i} className="h-full">
                <li className={cn('flex h-full flex-col rounded-3xl p-8', dark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white')}>
                  <span className={cn('flex size-12 items-center justify-center rounded-2xl', dark ? 'bg-gold-400/15 text-gold-300' : 'bg-teal-50 text-teal-700')}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <p className={cn('mt-6 font-serif text-xl leading-snug', dark ? 'text-white' : 'text-ink-900')}>{it.text}</p>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}

// ───────────────────────────── Philosophy ─────────────────────────────

function Philosophy({ section: s }: Props) {
  const pillars: { title: string; text: string }[] = s.data.pillars ?? [];
  return (
    <Shell>
      <div className="container-x">
        <Header s={s} action />
        <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {pillars.map((p, i) => (
            <PillarWithPlus key={i} index={i} last={i === pillars.length - 1}>
              <Reveal delay={0.08 * i} className="h-full">
                <div className="h-full rounded-3xl border border-stone-line bg-white p-7">
                  <p className="font-serif text-sm text-ember-600">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-3 text-2xl">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-700/80">{p.text}</p>
                </div>
              </Reveal>
            </PillarWithPlus>
          ))}
        </div>
        {(s.data.outcomeTitle || s.data.outcomeText) && (
          <Reveal delay={0.2}>
            <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-teal-800 to-ink-900 p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
              <p className="font-serif text-2xl">{s.data.outcomeTitle}</p>
              <p className="text-lg text-gold-200">{s.data.outcomeText}</p>
            </div>
          </Reveal>
        )}
      </div>
    </Shell>
  );
}

function PillarWithPlus({ children, last }: { children: ReactNode; index: number; last: boolean }) {
  return (
    <>
      {children}
      {!last && (
        <div className="hidden items-center justify-center lg:flex" aria-hidden>
          <span className="flex size-9 items-center justify-center rounded-full bg-gold-100 text-gold-600"><Plus className="size-4" /></span>
        </div>
      )}
    </>
  );
}

// ───────────────────────────── Academics ─────────────────────────────

function Academics({ section: s }: Props) {
  const dyn = (s.dynamic ?? {}) as { faculties?: Faculty[]; programCount?: number; offeredCount?: number };
  const faculties = dyn.faculties ?? [];
  return (
    <Shell className="bg-sand/50">
      <div className="container-x">
        <Header s={s} action />
        {s.data.statusNote && (
          <Reveal>
            <p className="mt-8 inline-flex items-start gap-2 rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-700 ring-1 ring-ember-100">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden />
              {s.data.statusNote}
            </p>
          </Reveal>
        )}
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {faculties.map((f, i) => (
            <Reveal key={f.id} delay={0.05 * i} className="h-full">
              <li className="group relative flex h-full flex-col rounded-3xl bg-white p-7 transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 font-serif text-sm font-semibold text-teal-800">{f.shortName ?? f.name.slice(0, 2)}</span>
                  <span className="text-xs text-ink-700/60">{f.programCount} proposed programs</span>
                </div>
                <h3 className="mt-6 text-xl">
                  <Link to={`/academics/programs?faculty=${f.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{f.name}</Link>
                </h3>
                {f.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-700/75">{f.description}</p>}
                <p className="mt-auto pt-5 text-xs font-medium text-ink-700/60">{f.departments.length} planned departments</p>
              </li>
            </Reveal>
          ))}
        </ul>
        {dyn.programCount !== undefined && (
          <p className="mt-8 text-sm text-ink-700/70">
            {dyn.programCount} programs listed in the Academic Master Plan · {dyn.offeredCount ? `${dyn.offeredCount} currently offered` : 'none currently offered'}.
          </p>
        )}
      </div>
    </Shell>
  );
}

// ───────────────────────────── Centers ─────────────────────────────

function Centers({ section: s }: Props) {
  const centers = (s.dynamic ?? []) as Center[];
  if (!centers.length) return null;
  return (
    <Shell>
      <div className="container-x">
        <Header s={s} action />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {centers.map((c, i) => (
            <Reveal key={c.id} delay={0.05 * i} className={cn('h-full', i === 0 && centers.length > 3 && 'lg:row-span-1')}>
              <CenterCard center={{ ...c, image: null }} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────────── Research ─────────────────────────────

function Research({ section: s }: Props) {
  const dark = s.variant !== 'default';
  const areas = (s.dynamic ?? []) as ResearchItem[];
  const image = media(s, 'imageId');
  return (
    <Shell dark={dark} className="overflow-hidden">
      <div className="container-x relative grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Header s={s} dark={dark} />
          <Buttons buttons={s.data.buttons} dark={dark} className="mt-8" />
          {image && (
            <Reveal delay={0.1}>
              <Img media={image} sizes="(min-width: 1024px) 40vw, 100vw" className="mt-10 aspect-[4/3] w-full rounded-3xl opacity-90" />
            </Reveal>
          )}
        </div>
        {areas.length > 0 && (
          <div className="lg:col-span-7">
            <p className={cn('text-xs font-semibold tracking-[0.18em] uppercase', dark ? 'text-gold-300' : 'text-teal-700')}>Planned priority research areas</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {areas.map((a, i) => (
                <Reveal key={a.id} delay={0.03 * i}>
                  <li><ResearchAreaCard item={a} dark={dark} /></li>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}

// ───────────────────────────── Campus ─────────────────────────────

function Campus({ section: s }: Props) {
  const panels = [
    { title: s.data.currentTitle, text: s.data.currentText, image: media(s, 'currentImageId'), status: 'CURRENT', label: 'Operational' },
    { title: s.data.futureTitle, text: s.data.futureText, image: media(s, 'futureImageId'), status: 'PROPOSED', label: 'Proposed' },
  ].filter((p) => p.title || p.text);
  return (
    <Shell className="bg-ivory">
      <div className="container-x">
        <Header s={s} action />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {panels.map((p, i) => (
            <Reveal key={i} delay={0.08 * i} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Img media={p.image} sizes="(min-width: 1024px) 50vw, 100vw" className="size-full" />
                  <StatusBadge status={p.status} label={p.label} className="absolute top-4 left-4 bg-white/95!" />
                </div>
                <div className="p-7 md:p-8">
                  <h3 className="text-2xl">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-700/80">{p.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────────── News / Events ─────────────────────────────

function News({ section: s }: Props) {
  const items = (s.dynamic ?? []) as NewsCard[];
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <Shell>
      <div className="container-x">
        <Header s={s} action />
        {s.variant === 'list' ? (
          <ul className="mt-12 divide-y divide-stone-line border-y border-stone-line">
            {items.map((n) => (
              <li key={n.id} className="py-6"><NewsCardView item={{ ...n, image: null }} /></li>
            ))}
          </ul>
        ) : (
          <div className="mt-14 grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7"><NewsCardView item={first} large /></Reveal>
            <ul className="space-y-8 lg:col-span-5">
              {rest.map((n, i) => (
                <Reveal key={n.id} delay={0.06 * i}>
                  <li className="relative grid grid-cols-[7rem_1fr] gap-5 sm:grid-cols-[9rem_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      {n.image ? <Img media={n.image} sizes="9rem" className="size-full" /> : <NewsPlaceholder compact />}
                    </div>
                    <div>
                      <p className="text-xs text-ink-700/65">{n.category?.name}</p>
                      <h3 className="mt-1 text-lg leading-snug">
                        <Link to={`/news/${n.slug}`} className="after:absolute after:inset-0 hover:text-teal-800">{n.title}</Link>
                      </h3>
                      {n.publishedAt && <p className="mt-2 text-xs text-ink-700/60">{new Date(n.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' })}</p>}
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Events({ section: s }: Props) {
  const items = (s.dynamic ?? []) as EventCard[];
  if (!items.length && s.data.hideWhenEmpty !== false) return null;
  return (
    <Shell className="bg-sand/50">
      <div className="container-x">
        <Header s={s} action />
        {items.length ? (
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => <li key={e.id}><EventCardView item={e} /></li>)}
          </ul>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-stone-line bg-white/70 p-8 text-center text-ink-700/75">{s.data.emptyMessage || 'No upcoming events have been announced.'}</p>
        )}
      </div>
    </Shell>
  );
}

// ───────────────────────────── Milestones / partnerships ─────────────────────────────

function Partnerships({ section: s }: Props) {
  const items: { title: string; date?: string; text?: string; imageId?: string }[] = s.data.items ?? [];
  if (!items.length) return null;
  return (
    <Shell className="bg-white">
      <div className="container-x">
        <Header s={s} action />
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const img = it.imageId ? s.media[it.imageId] : null;
            return (
              <Reveal key={i} delay={0.06 * i} className="h-full">
                <li className="flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Img media={img} sizes="(min-width: 1024px) 25vw, 50vw" className="size-full" />
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="size-2 rounded-full bg-ember-500" aria-hidden />
                    {it.date && <span className="text-xs font-semibold tracking-wide text-ember-700 uppercase">{it.date}</span>}
                  </div>
                  <h3 className="mt-2 text-lg leading-snug">{it.title}</h3>
                  {it.text && <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{it.text}</p>}
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </Shell>
  );
}

// ───────────────────────────── Gallery ─────────────────────────────

function Gallery({ section: s }: Props) {
  const items = (s.dynamic ?? []) as GalleryItem[];
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <Shell className="bg-ivory">
      <div className="container-x">
        <Header s={s} action />
        <ul className="mt-12 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.id} className={cn(i === 0 && 'col-span-2 row-span-2', i === 3 && 'md:row-span-2')}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative size-full overflow-hidden rounded-2xl focus-visible:ring-4 focus-visible:ring-teal-400"
                aria-label={`Open image: ${it.caption || it.alt}`}
              >
                <Img media={it.media} sizes={i === 0 ? '50vw' : '25vw'} alt={it.alt} className="size-full transition-transform duration-700 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Lightbox items={items.map((it) => ({ media: it.media, caption: it.caption, alt: it.alt }))} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
    </Shell>
  );
}

// ───────────────────────────── CTA ─────────────────────────────

function Cta({ section: s }: Props) {
  const image = media(s, 'imageId');
  if (s.variant === 'image' && image) {
    return (
      <section className="relative isolate overflow-hidden py-24 md:py-32">
        <Img media={image} sizes="100vw" alt="" className="absolute inset-0 -z-10 size-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/90 via-ink-900/75 to-teal-900/50" aria-hidden />
        <div className="container-x">
          <Reveal className="max-w-2xl">
            {s.data.eyebrow && <p className="eyebrow text-gold-300!">{s.data.eyebrow}</p>}
            {s.data.title && <RiseText as="h2" text={s.data.title} className="mt-3 text-4xl text-white sm:text-5xl" />}
            {s.data.description && <p className="mt-5 text-lg text-teal-50/85">{s.data.description}</p>}
            <Buttons buttons={s.data.buttons} dark className="mt-9 text-white" />
          </Reveal>
        </div>
      </section>
    );
  }
  return (
    <section className="py-16 md:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ember-500 to-ember-700 px-8 py-14 text-white md:px-14">
          <div className="pattern-lines absolute inset-0 opacity-40" aria-hidden />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              {s.data.eyebrow && <p className="eyebrow text-white/80!">{s.data.eyebrow}</p>}
              {s.data.title && <RiseText as="h2" text={s.data.title} className="mt-3 text-3xl text-white sm:text-4xl" />}
              {s.data.description && <p className="mt-4 text-lg text-white/85">{s.data.description}</p>}
            </div>
            <Buttons buttons={s.data.buttons?.map((b: { style: string }) => ({ ...b, style: 'secondary' }))} dark className="text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AnnouncementSection({ section: s }: Props) {
  const item = s.dynamic as Announcement | Announcement[] | null;
  const list = Array.isArray(item) ? item : item ? [item] : [];
  return list.length ? <AnnouncementBar items={list} /> : null;
}

const RENDERERS: Record<string, (p: Props) => ReactNode> = {
  ANNOUNCEMENT: AnnouncementSection,
  HERO: Hero,
  ABOUT: About,
  STATISTICS: Statistics,
  VISION: Vision,
  MISSION: Mission,
  PHILOSOPHY: Philosophy,
  ACADEMICS: Academics,
  CENTERS: Centers,
  RESEARCH: Research,
  CAMPUS: Campus,
  NEWS: News,
  EVENTS: Events,
  PARTNERSHIPS: Partnerships,
  GALLERY: Gallery,
  CTA: Cta,
  FOOTER: () => null,
};

export function HomepageRenderer({ sections }: { sections: HomeSection[] }) {
  return (
    <>
      {sections.map((s) => {
        const Component = RENDERERS[s.type];
        return Component ? <Component key={s.id} section={s} /> : null;
      })}
    </>
  );
}
