import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { HomepageRenderer } from '@/components/home/sections';
import { Seo } from '@/components/ui/Seo';
import { ApiError } from '@/lib/api';
import { useHomepage, usePagePreview } from '@/lib/queries';
import { PageSkeleton, PageView } from './CmsPage';
import { HomeSkeleton } from './HomePage';
import NotFound from './NotFound';

function PreviewBar({ label, back }: { label: string; back: string }) {
  return (
    <div className="sticky top-[4.5rem] z-30 bg-gold-400 text-ink-950">
      <div className="container-x flex items-center justify-between gap-4 py-2 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Eye className="size-4" aria-hidden />{label}</p>
        <Link to={back} className="font-semibold underline underline-offset-4">Back to editor</Link>
      </div>
    </div>
  );
}

function Guard({ error, children }: { error: unknown; children: ReactNode }) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return <Navigate to="/admin/login" replace />;
  if (error instanceof ApiError && error.status === 404) return <NotFound />;
  return <>{children}</>;
}

export function HomepagePreview() {
  const { data, isLoading, error } = useHomepage(true);
  return (
    <Guard error={error}>
      <Seo title="Homepage preview" noindex />
      <PreviewBar label="Preview: unpublished homepage draft" back="/admin/homepage" />
      {isLoading || !data ? <HomeSkeleton /> : <HomepageRenderer sections={data.sections} />}
    </Guard>
  );
}

export function PagePreview() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = usePagePreview(id);
  return (
    <Guard error={error}>
      <Seo title="Page preview" noindex />
      <PreviewBar label="Preview: unpublished page draft" back={`/admin/pages/${id}`} />
      {isLoading || !data ? <PageSkeleton /> : <PageView page={data} />}
    </Guard>
  );
}
