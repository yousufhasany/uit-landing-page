import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteData } from '@/lib/types';
import { BRAND_ICONS } from '../ui/BrandIcons';
import { SmartLink } from '../ui/primitives';

const SOCIAL_ICONS: Record<string, (p: { className?: string }) => React.ReactNode> = { ...BRAND_ICONS };
const CONTACT_ICONS = { ADDRESS: MapPin, PHONE: Phone, EMAIL: Mail, WEBSITE: Globe, HOURS: Globe } as const;

export function contactHref(type: string, value: string) {
  if (type === 'PHONE') return `tel:${value.replace(/[^\d+]/g, '')}`;
  if (type === 'EMAIL') return `mailto:${value}`;
  if (type === 'WEBSITE') return value;
  return null;
}

export function Footer({ site }: { site: SiteData }) {
  const columns = ['footer-explore', 'footer-resources'].map((k) => site.menus[k]).filter(Boolean);
  const legal = site.menus['footer-legal']?.items ?? [];
  const contacts = [...site.contacts.filter((c) => c.type !== 'EMAIL').slice(0, 4), ...site.contacts.filter((c) => c.type === 'EMAIL')];
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-teal-50">
      <div className="pattern-lines absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-4">
            {site.identity.logoOnDark && <img src={site.identity.logoOnDark.url} alt="" className="h-16 w-auto" loading="lazy" />}
            <div>
              <p className="font-serif text-xl text-white">{site.identity.name}</p>
              <p className="mt-1 text-sm text-teal-100/70">{site.identity.tagline}</p>
            </div>
          </div>
          {site.footer.description && <p className="mt-6 max-w-sm text-sm leading-relaxed text-teal-100/70">{site.footer.description}</p>}
          {site.social.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {site.social.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform] ?? Globe;
                return (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex size-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10">
                      <Icon className="size-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {columns.map((col) => (
          <nav key={col.name} aria-label={col.name.replace('Footer: ', '')} className="md:col-span-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">{col.name.replace('Footer: ', '')}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {col.items.map((i) => (
                <li key={i.id}>
                  <SmartLink to={i.url} className="text-teal-100/80 transition hover:text-white">{i.label}</SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {contacts.length > 0 && (
          <div className="md:col-span-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Contact</p>
            <ul className="mt-5 space-y-4 text-sm">
              {contacts.map((c) => {
                const Icon = CONTACT_ICONS[c.type] ?? Globe;
                const href = contactHref(c.type, c.value);
                return (
                  <li key={c.id} className="flex gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
                    <span>
                      <span className="block text-xs text-teal-100/60">{c.label}</span>
                      {href ? <a href={href} className="text-teal-50 hover:text-white">{c.value}</a> : <span className="text-teal-50">{c.value}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col gap-4 py-6 text-xs text-teal-100/60 md:flex-row md:items-center md:justify-between">
          <p>© {year} {site.footer.copyright}</p>
          {site.footer.note && <p className="md:max-w-md md:text-center">{site.footer.note}</p>}
          <ul className="flex gap-5">
            {legal.map((l) => (
              <li key={l.id}><SmartLink to={l.url} className="hover:text-white">{l.label}</SmartLink></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
