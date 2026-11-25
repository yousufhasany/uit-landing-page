import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { cn, isExternal } from '@/lib/format';
import type { Button as ButtonData, Media } from '@/lib/types';
import { RiseText } from './text-motion';

/** Internal links use the router; external links open safely in a new tab. */
export function SmartLink({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string } & Omit<ComponentProps<'a'>, 'href'>) {
  if (/^(https?:|mailto:|tel:)/i.test(to)) {
    const external = isExternal(to);
    return (
      <a href={to} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
}

const buttonStyles = {
  primary: 'bg-ember-500 text-white hover:bg-ember-600 shadow-sm',
  secondary: 'bg-white/0 text-current ring-1 ring-inset ring-current/30 hover:ring-current/60 hover:bg-current/5',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  light: 'bg-white text-ink-900 hover:bg-ivory shadow-sm',
  link: 'px-0! py-0! text-teal-700 hover:text-teal-900 underline-offset-4 hover:underline',
} as const;

export function ButtonLink({ to, style = 'primary', children, className }: { to: string; style?: keyof typeof buttonStyles; children: ReactNode; className?: string }) {
  const external = /^https?:\/\//.test(to) && isExternal(to);
  return (
    <SmartLink
      to={to}
      className={cn('group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors', buttonStyles[style], className)}
    >
      {children}
      {external ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </SmartLink>
  );
}

export function Buttons({ buttons, dark = false, className }: { buttons?: ButtonData[]; dark?: boolean; className?: string }) {
  if (!buttons?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {buttons.map((b, i) => (
        <ButtonLink
          key={`${b.url}-${i}`}
          to={b.url}
          style={b.style === 'primary' ? 'primary' : b.style === 'link' ? 'link' : 'secondary'}
          className={b.style === 'link' && dark ? 'text-gold-300! hover:text-white!' : undefined}
        >
          {b.label}
        </ButtonLink>
      ))}
    </div>
  );
}

/** Responsive image from a media DTO. `priority` disables lazy loading for above-the-fold images. */
export function Img({
  media, sizes = '100vw', className, priority = false, alt, focal,
}: { media: Media | null | undefined; sizes?: string; className?: string; priority?: boolean; alt?: string; focal?: { x: number; y: number } }) {
  if (!media) return <div className={cn('bg-gradient-to-br from-teal-100 to-sand', className)} aria-hidden />;
  return (
    <img
      src={media.url}
      srcSet={media.srcSet ?? undefined}
      sizes={media.srcSet ? sizes : undefined}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      alt={alt ?? media.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={cn('object-cover', className)}
      style={focal ? { objectPosition: `${focal.x}% ${focal.y}%` } : undefined}
    />
  );
}

export function SectionHeading({
  eyebrow, title, description, align = 'left', dark = false, className, action,
}: { eyebrow?: string; title?: string; description?: string; align?: 'left' | 'center'; dark?: boolean; className?: string; action?: ReactNode }) {
  if (!eyebrow && !title && !description) return null;
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', align === 'center' && 'items-center text-center md:flex-col md:items-center', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className={cn('eyebrow', dark && 'text-gold-300')}>{eyebrow}</p>}
        {title && <RiseText as="h2" text={title} className={cn('mt-3 text-3xl leading-tight sm:text-4xl', dark ? 'text-white' : 'text-ink-900')} />}
        {description && <p className={cn('mt-4 text-lg leading-relaxed', dark ? 'text-teal-100/80' : 'text-ink-700/80')}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1.15, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const statusTone: Record<string, string> = {
  CURRENT: 'bg-teal-100 text-teal-800 ring-teal-200',
  ACTIVE: 'bg-teal-100 text-teal-800 ring-teal-200',
  IN_PROGRESS: 'bg-gold-100 text-gold-600 ring-gold-300/60',
  APPROVED: 'bg-gold-100 text-gold-600 ring-gold-300/60',
  UNDER_DEVELOPMENT: 'bg-gold-100 text-gold-600 ring-gold-300/60',
  PROPOSED: 'bg-ember-50 text-ember-700 ring-ember-100',
  CONCEPT: 'bg-sand text-ink-700 ring-stone-line',
};

export function StatusBadge({ status, label, className }: { status: string; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', statusTone[status] ?? 'bg-sand text-ink-700 ring-stone-line', className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink-700', className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-stone-line/60', className)} aria-hidden />;
}

export function EmptyState({ title, text, icon, action }: { title: string; text?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-line bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sand text-teal-700">{icon}</div>}
      <p className="font-serif text-xl text-ink-900">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-ink-700/80">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function RichText({ html, className }: { html: string; className?: string }) {
  // HTML is sanitized on the server with an allow-list before it is stored.
  return <div className={cn('prose-uit', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
