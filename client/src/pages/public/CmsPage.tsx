import { useLocation } from 'react-router';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { crumbsForSlug, PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/ui/Seo';
import { Skeleton } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api';
import { usePage } from '@/lib/queries';
import type { PageData } from '@/lib/types';
import NotFound from './NotFound';

export function PageSkeleton() {
  return (
    <div aria-busy="true">
      <div className="border-b border-stone-line bg-sand/50">
        <div className="container-x space-y-5 py-20">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
      <div className="container-x space-y-4 py-16">
        <Skeleton className="h-5 w-full max-w-3xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-3xl" />
      </div>
    </div>
  );
}

export function PageView({ page }: { page: PageData }) {
  return (
    <article>
      <PageHeader eyebrow={page.eyebrow} title={page.title} summary={page.summary} crumbs={crumbsForSlug(page.slug, page.title)} image={page.featuredImage} />
      <PageBody>
        <BlockRenderer blocks={page.blocks} media={page.media} />
      </PageBody>
    </article>
  );
}

export default function CmsPage() {
  const { pathname } = useLocation();
  const slug = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, ''));
  const { data, isLoading, error } = usePage(slug);

  if (isLoading) return <PageSkeleton />;
  if (error instanceof ApiError && error.status === 404) return <NotFound />;
  if (error || !data) return <div className="container-x py-32 text-center text-ink-700/70">This page could not be loaded. Please try again.</div>;

  return (
    <>
      <Seo title={data.seoTitle || data.title} description={data.seoDescription || data.summary} image={data.featuredImage} />
      <PageView page={data} />
    </>
  );
}
