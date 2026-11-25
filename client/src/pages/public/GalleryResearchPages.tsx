import { FileText, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Lightbox } from '@/components/ui/Lightbox';
import { Seo } from '@/components/ui/Seo';
import { ButtonLink, EmptyState, Img, Skeleton } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api';
import { PHASE_LABELS } from '@/lib/format';
import { useGalleries, useGallery, useResearch } from '@/lib/queries';
import { PageSkeleton } from './CmsPage';
import NotFound from './NotFound';

export function GalleryPage() {
  const { data, isLoading } = useGalleries();
  return (
    <>
      <Seo title="Campus gallery" description="Photographs of UIT’s temporary campus, permanent campus site and institutional milestones." />
      <PageHeader eyebrow="Campus" title="Gallery" summary="Photographs of UIT’s temporary campus, the permanent campus site and key institutional moments." crumbs={[{ label: 'Campus', to: '/campus' }, { label: 'Gallery' }]} />
      <PageBody>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
        ) : !data?.length ? (
          <EmptyState title="No albums published yet" />
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((g) => (
              <li key={g.id} className="group relative">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-sand">
                  <Img media={g.cover} sizes="(min-width: 1024px) 33vw, 50vw" className="size-full transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-wide text-teal-700 uppercase">{g.itemCount} photos</p>
                <h2 className="mt-1 text-2xl"><Link to={`/campus/gallery/${g.slug}`} className="after:absolute after:inset-0 group-hover:text-teal-800">{g.title}</Link></h2>
                {g.description && <p className="mt-2 line-clamp-2 text-ink-700/75">{g.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

export function GalleryAlbumPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, error } = useGallery(slug);
  const [open, setOpen] = useState<number | null>(null);
  if (isLoading) return <PageSkeleton />;
  if ((error instanceof ApiError && error.status === 404) || !data) return <NotFound />;

  return (
    <>
      <Seo title={data.title} description={data.description} image={data.items[0]?.media} />
      <PageHeader eyebrow="Gallery" title={data.title} summary={data.description} crumbs={[{ label: 'Campus', to: '/campus' }, { label: 'Gallery', to: '/campus/gallery' }, { label: data.title }]} />
      <PageBody>
        {!data.items.length ? (
          <EmptyState title="This album has no photos yet" />
        ) : (
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {data.items.map((it, i) => (
              <li key={it.id} className="mb-4 break-inside-avoid">
                <figure>
                  <button type="button" onClick={() => setOpen(i)} className="group block w-full overflow-hidden rounded-2xl focus-visible:ring-4 focus-visible:ring-teal-400" aria-label={`Enlarge: ${it.caption || it.alt}`}>
                    <Img media={it.media} alt={it.alt} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="w-full transition-transform duration-700 group-hover:scale-[1.03]" />
                  </button>
                  {it.caption && <figcaption className="mt-2 text-sm text-ink-700/70">{it.caption}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-12"><ButtonLink to="/campus/gallery" style="secondary">All albums</ButtonLink></div>
      </PageBody>
      <Lightbox items={data.items.map((it) => ({ media: it.media, caption: it.caption, alt: it.alt }))} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}

function ResearchList({ type }: { type: 'PROJECT' | 'PUBLICATION' }) {
  const { data, isLoading } = useResearch({ type });
  const isProject = type === 'PROJECT';
  const title = isProject ? 'Research projects' : 'Publications';
  return (
    <>
      <Seo title={title} description={isProject ? 'Research projects at UIT.' : 'Publications from UIT and its Center for Research & Innovation.'} noindex={!isLoading && !data?.items.length} />
      <PageHeader eyebrow="Research" title={title} crumbs={[{ label: 'Research', to: '/research' }, { label: title }]} />
      <PageBody>
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : !data?.items.length ? (
          <EmptyState
            icon={isProject ? <FlaskConical className="size-5" /> : <FileText className="size-5" />}
            title={isProject ? 'No research projects yet' : 'No publications yet'}
            text={isProject ? 'Research projects will be listed here once they begin.' : 'Publications will be listed here once they are released.'}
            action={<ButtonLink to="/research" style="secondary">Research at UIT</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-stone-line border-y border-stone-line">
            {data.items.map((r) => (
              <li key={r.id} className="grid gap-6 py-8 md:grid-cols-[12rem_1fr]">
                {r.image ? <Img media={r.image} sizes="12rem" className="aspect-[4/3] w-full rounded-2xl" /> : <div className="hidden md:block" />}
                <div>
                  <div className="flex flex-wrap gap-3 text-xs text-ink-700/60">
                    {r.center && <Link to={`/centers/${r.center.slug}`} className="font-semibold text-teal-700 hover:underline">{r.center.acronym ?? r.center.name}</Link>}
                    {r.phase && <span>{PHASE_LABELS[r.phase] ?? r.phase}</span>}
                  </div>
                  <h2 className="mt-2 text-2xl">
                    {r.externalUrl ? <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-teal-800">{r.title}</a> : r.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink-700/80">{r.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

export const ResearchProjectsPage = () => <ResearchList type="PROJECT" />;
export const PublicationsPage = () => <ResearchList type="PUBLICATION" />;
