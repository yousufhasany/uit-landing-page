import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/format';
import type { MenuNode, SiteData } from '@/lib/types';
import { ButtonLink, SmartLink } from '../ui/primitives';
import { SearchDialog } from './SearchDialog';

function isActive(pathname: string, node: MenuNode) {
  const match = (url: string) => url !== '/' && (pathname === url || pathname.startsWith(`${url}/`));
  return match(node.url) || node.children.some((c) => match(c.url));
}

function DesktopItem({ node }: { node: MenuNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const ref = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<number>(undefined);
  const active = isActive(pathname, node);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const base = cn(
    'relative inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.9rem] font-medium transition-colors xl:px-3',
    active ? 'text-teal-800' : 'text-ink-800 hover:text-teal-700',
  );

  if (!node.children.length) {
    return (
      <li>
        <SmartLink to={node.url} className={base}>
          {node.label}
          {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-ember-500" aria-hidden />}
        </SmartLink>
      </li>
    );
  }

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => { window.clearTimeout(closeTimer.current); setOpen(true); }}
      onMouseLeave={() => { closeTimer.current = window.setTimeout(() => setOpen(false), 120); }}
    >
      <button type="button" className={base} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        {node.label}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-ember-500" aria-hidden />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-1/2 top-full z-40 w-80 -translate-x-1/2 pt-3"
          >
            <ul className="overflow-hidden rounded-2xl border border-stone-line bg-white p-2 shadow-lift">
              {node.children.map((child) => (
                <li key={child.id}>
                  <SmartLink to={child.url} className="block rounded-xl px-4 py-3 transition-colors hover:bg-ivory focus-visible:bg-ivory">
                    <span className="block text-sm font-semibold text-ink-900">{child.label}</span>
                    {child.description && <span className="mt-0.5 block text-xs text-ink-700/70">{child.description}</span>}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function MobileNav({ items, onClose, site }: { items: MenuNode[]; onClose: () => void; site: SiteData }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.nav
        aria-label="Mobile"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-ivory shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-stone-line px-5 py-4">
          <span className="font-serif text-lg">{site.identity.shortName}</span>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4">
          {items.map((node) => (
            <li key={node.id} className="border-b border-stone-line/70 last:border-0">
              {node.children.length ? (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-3.5 text-left font-medium"
                    aria-expanded={expanded === node.id}
                    onClick={() => setExpanded((e) => (e === node.id ? null : node.id))}
                  >
                    {node.label}
                    <ChevronDown className={cn('size-4 transition-transform', expanded === node.id && 'rotate-180')} aria-hidden />
                  </button>
                  {expanded === node.id && (
                    <ul className="pb-3 pl-3">
                      {node.children.map((c) => (
                        <li key={c.id}>
                          <NavLink to={c.url} onClick={onClose} className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm', isActive ? 'bg-teal-50 text-teal-800' : 'text-ink-700')}>
                            {c.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <SmartLink to={node.url} onClick={onClose} className="block px-3 py-3.5 font-medium">
                  {node.label}
                </SmartLink>
              )}
            </li>
          ))}
        </ul>
        {site.header.ctaLabel && site.header.ctaUrl && (
          <div className="border-t border-stone-line p-5">
            <ButtonLink to={site.header.ctaUrl} className="w-full justify-center">{site.header.ctaLabel}</ButtonLink>
          </div>
        )}
      </motion.nav>
    </motion.div>
  );
}

export function Header({ site }: { site: SiteData }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const items = site.menus.header?.items ?? [];
  const logo = site.identity.logo;

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header data-no-motion className={cn('sticky top-0 z-40 border-b transition-all', scrolled ? 'border-stone-line bg-ivory/90 backdrop-blur-md' : 'border-transparent bg-ivory')}>
        <div className="container-x flex h-[4.5rem] items-center gap-3 lg:gap-6">
          <SmartLink to="/" className="flex min-w-0 items-center gap-3 lg:shrink-0" aria-label={`${site.identity.name}, home`}>
            {logo ? <img src={logo.url} alt="" width={36} height={48} className="h-11 w-auto shrink-0" /> : null}
            <span className="min-w-0 leading-tight">
              <span className="block font-serif text-[0.95rem] font-semibold text-ink-900 sm:text-lg">{site.identity.name}</span>
              <span className="hidden text-[0.7rem] tracking-wide text-ink-700/70 sm:block lg:hidden 2xl:block">{site.identity.tagline}</span>
            </span>
          </SmartLink>

          <nav aria-label="Main" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {items.map((node) => <DesktopItem key={node.id} node={node} />)}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            {site.header.showSearch && (
              <button type="button" onClick={() => setSearchOpen(true)} className="rounded-full p-2.5 text-ink-800 hover:bg-sand" aria-label="Search the website">
                <Search className="size-5" />
              </button>
            )}
            {site.header.ctaLabel && site.header.ctaUrl && (
              <span className="hidden xl:block"><ButtonLink to={site.header.ctaUrl}>{site.header.ctaLabel}</ButtonLink></span>
            )}
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-full p-2.5 hover:bg-sand lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>{mobileOpen && <MobileNav items={items} site={site} onClose={() => setMobileOpen(false)} />}</AnimatePresence>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
