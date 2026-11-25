import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import type { Media } from '@/lib/types';

export interface LightboxItem {
  media: Media;
  caption?: string | null;
  alt?: string;
}

export function Lightbox({ items, index, onChange, onClose }: { items: LightboxItem[]; index: number | null; onChange: (i: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null && items[index];
  const prev = useCallback(() => index !== null && onChange((index - 1 + items.length) % items.length), [index, items.length, onChange]);
  const next = useCallback(() => index !== null && onChange((index + 1) % items.length), [index, items.length, onChange]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [open, onClose, prev, next]);

  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[80] flex flex-col bg-ink-950/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-teal-100/80">
            <span aria-live="polite">{(index ?? 0) + 1} / {items.length}</span>
            <button ref={closeRef} type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close image viewer">
              <X className="size-6 text-white" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.img
              key={item.media.id}
              src={item.media.url}
              alt={item.alt ?? item.media.alt}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            {items.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4" aria-label="Previous image">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={next} className="absolute right-2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4" aria-label="Next image">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
          <p className="mx-auto max-w-3xl px-6 py-5 text-center text-sm text-teal-50/90">{item.caption || item.media.caption || item.alt || item.media.alt}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
