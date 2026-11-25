import { Seo } from '@/components/ui/Seo';
import { ButtonLink } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Seo title="Page not found" noindex />
      <p className="font-serif text-7xl text-teal-800">404</p>
      <h1 className="mt-4 text-3xl">This page could not be found</h1>
      <p className="mt-3 max-w-md text-ink-700/75">The page may have moved, or the information has not been published yet.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">Back to home</ButtonLink>
        <ButtonLink to="/contact" style="secondary">Contact UIT</ButtonLink>
      </div>
    </section>
  );
}
