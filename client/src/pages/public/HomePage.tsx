import { HomepageRenderer } from '@/components/home/sections';
import { Seo } from '@/components/ui/Seo';
import { Skeleton } from '@/components/ui/primitives';
import { useHomepage } from '@/lib/queries';

export function HomeSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-[78vh] rounded-none" />
      <div className="container-x grid gap-6 py-20 md:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading, isError } = useHomepage();
  if (isLoading) return <HomeSkeleton />;
  if (isError || !data) {
    return <div className="container-x py-32 text-center text-ink-700/70">The homepage could not be loaded. Please refresh the page.</div>;
  }
  return (
    <>
      <Seo />
      <HomepageRenderer sections={data.sections} />
    </>
  );
}
