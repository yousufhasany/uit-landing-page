import { Megaphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { cn } from '@/lib/format';
import { useSite } from '@/lib/queries';
import type { Announcement } from '@/lib/types';
import { SmartLink } from '../ui/primitives';
import { Footer } from './Footer';
import { Header } from './Header';

const DISMISSED = 'uit-dismissed-announcements';

export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [dismissed, setDismissed] = useState<string[]>(() => JSON.parse(sessionStorage.getItem(DISMISSED) ?? '[]'));
  const current = items.find((a) => !dismissed.includes(a.id));
  if (!current) return null;
  const tone = current.style === 'URGENT' ? 'bg-ember-600 text-white' : current.style === 'HIGHLIGHT' ? 'bg-ink-900 text-teal-50' : 'bg-teal-50 text-teal-900';
  const dismiss = () => {
    const next = [...dismissed, current.id];
    setDismissed(next);
    sessionStorage.setItem(DISMISSED, JSON.stringify(next));
  };
  return (
    <div className={cn('relative text-sm', tone)} role="region" aria-label="Announcement">
      <div className="container-x flex items-center gap-3 py-2.5 pr-12">
        <Megaphone className="hidden size-4 shrink-0 text-gold-400 sm:block" aria-hidden />
        <p className="min-w-0">
          <span className="font-semibold">{current.title}:</span> <span className="opacity-90">{current.message}</span>
          {current.url && (
            <SmartLink to={current.url} className="ml-2 font-semibold underline underline-offset-4 hover:no-underline">
              {current.linkLabel || 'Learn more'}
            </SmartLink>
          )}
        </p>
      </div>
      <button type="button" onClick={dismiss} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/10" aria-label="Dismiss announcement">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function PublicLayout() {
  const { data: site, isError, refetch } = useSite();
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-serif text-2xl">The website could not be loaded.</p>
        <p className="text-ink-700/70">Please check your connection and try again.</p>
        <button type="button" onClick={() => refetch()} className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white">Retry</button>
      </div>
    );
  }
  if (!site) {
    return <div className="min-h-screen bg-ivory" aria-busy="true" />;
  }

  return (
    <div className="copy-motion flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {/* On the homepage the announcement is a builder section, so editors control its position. */}
      {pathname !== '/' && pathname !== '/admin/preview/homepage' && <AnnouncementBar items={site.announcements} />}
      <Header site={site} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer site={site} />
      <ScrollRestoration />
    </div>
  );
}
