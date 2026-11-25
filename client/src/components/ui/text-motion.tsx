import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

const EASE = [0.16, 1, 0.3, 1] as const;

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span';

/**
 * Reveals a heading one word at a time. Longer copy rises as a single line
 * so a paragraph doesn't take several seconds to finish.
 */
export function RiseText({
  text, as: Tag = 'span', className, delay = 0,
}: { text: string; as?: Tag; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!text.trim()) return null;
  if (reduce || words.length < 2 || words.length > 18) {
    return <Tag className={className}>{text}</Tag>;
  }
  return (
    <Tag className={cn('tm-words', className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <motion.span
            className="tm-word"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            aria-hidden
          >
            <motion.span
              className="inline-block"
              variants={{ hidden: { y: '70%', opacity: 0 }, show: { y: '0%', opacity: 1 } }}
              transition={{ duration: 1.15, delay: delay + i * 0.09, ease: EASE }}
            >
              {word}
            </motion.span>
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/** A short fade-and-rise for a block of copy. */
export function RiseBlock({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 1.15, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
