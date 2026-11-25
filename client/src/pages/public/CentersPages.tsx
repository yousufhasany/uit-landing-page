import { Check } from 'lucide-react';
import { useParams } from 'react-router';
import { CenterCard } from '@/components/cards';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/ui/Seo';
import { ButtonLink, EmptyState, Reveal, RichText, Skeleton } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api';
import { useCenter, useCenters } from '@/lib/queries';
import { PageSkeleton } from './CmsPage';
import NotFound from './NotFound';

export function CentersPage() {
  const { data, isLoading } = useCenters();
  return (
    <>
      <Seo title="Specialist centers" description="Centers planned at UIT for research, co-curricular engagement, professional development, publication and foundational studies." />
      <PageHeader
        eyebrow="Centers"
        title="Specialist centers"
        summary="Five centers are planned to support every school: driving research, engagement, professional development, publication and foundational studies."
        crumbs={[{ label: 'Centers' }]}
      />
      <PageBody>
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div>
        ) : data?.items.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c, i) => (
              <Reveal key={c.id} delay={0.04 * i} className="h-full"><li className="h-full"><CenterCard center={c} index={i} /></li></Reveal>
            ))}
          </ul>
        ) : (
          <EmptyState title="No centers published yet" />
        )}
      </PageBody>
    </>
  );
}

export function CenterDetailPage() {
  const { slug = '' } = useParams();
  const { data: c, isLoading, error } = useCenter(slug);
  if (isLoading) return <PageSkeleton />;
  if (error instanceof ApiError && error.status === 404) return <NotFound />;
  if (!c) return <NotFound />;

  return (
    <>
      <Seo title={c.seoTitle || c.name} description={c.seoDescription || c.tagline || c.overview.slice(0, 160)} image={c.image} />
      <PageHeader eyebrow={c.acronym ? `Center · ${c.acronym}` : 'Center'} title={c.name} summary={c.tagline} crumbs={[{ label: 'Centers', to: '/centers' }, { label: c.acronym ?? c.name }]} image={c.image} />
      <PageBody className="grid gap-14 lg:grid-cols-12">
        <div className="space-y-14 lg:col-span-8">
          <section>
            <h2 className="text-3xl">Overview</h2>
            <p className="mt-5 text-lg leading-relaxed whitespace-pre-line text-ink-700/85">{c.overview}</p>
            {c.description && <RichText html={c.description} className="mt-6" />}
          </section>

          {c.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-2xl">{s.title}</h2>
              {s.body && <p className="mt-4 leading-relaxed whitespace-pre-line text-ink-700/85">{s.body}</p>}
              {s.items && s.items.length > 0 && (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-3 rounded-xl border border-stone-line bg-white px-4 py-3 text-[0.95rem]">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden />
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            {c.objectives.length > 0 && (
              <div className="rounded-3xl bg-ink-900 p-7 text-teal-50">
                <h2 className="text-xl text-white">Objectives</h2>
                <ul className="mt-5 space-y-3.5 text-sm leading-relaxed">
                  {c.objectives.map((o, i) => (
                    <li key={i} className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.ctaLabel && c.ctaUrl && <ButtonLink to={c.ctaUrl} className="w-full justify-center">{c.ctaLabel}</ButtonLink>}
            <ButtonLink to="/centers" style="secondary" className="w-full justify-center">All centers</ButtonLink>
          </div>
        </aside>
      </PageBody>
    </>
  );
}
