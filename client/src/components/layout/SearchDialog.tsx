import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSearch } from '@/lib/queries';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data, isFetching } = useSearch(debounced);
  const results = debounced.length >= 2 ? data?.results ?? [] : [];

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 220);
    return () => clearTimeout(t);
  }, [term]);
  useEffect(() => setActive(0), [debounced]);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    setTimeout(() => input.current?.focus(), 20);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open]);

  const go = (url: string) => {
    onClose();
    setTerm('');
    navigate(url);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-lift"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active].url);
            }}
          >
            <div className="flex items-center gap-3 border-b border-stone-line px-5">
              <Search className="size-5 text-ink-700/60" aria-hidden />
              <input
                ref={input}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search pages, programs, centers, news…"
                className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-700/50"
                aria-label="Search terms"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
              />
              {isFetching && <Loader2 className="size-4 animate-spin text-ink-700/50" aria-hidden />}
              <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-sand" aria-label="Close search">
                <X className="size-5" />
              </button>
            </div>
            <ul id="search-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
              {debounced.length < 2 && <li className="px-4 py-8 text-center text-sm text-ink-700/60">Type at least two characters.</li>}
              {debounced.length >= 2 && !isFetching && results.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-ink-700/60">No results for “{debounced}”.</li>
              )}
              {results.map((r, i) => (
                <li key={r.url + i} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r.url)}
                    className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left ${i === active ? 'bg-ivory' : ''}`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-teal-800 uppercase">{r.type}</span>
                    <span className="min-w-0">
                      <span className="block font-medium text-ink-900">{r.title}</span>
                      {r.excerpt && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-700/70">{r.excerpt}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
