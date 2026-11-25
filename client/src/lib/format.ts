const DHAKA = 'Asia/Dhaka';

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: DHAKA, ...opts }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function eventWhen(startsAt: string, endsAt: string | null, isAllDay: boolean) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const day = formatDate(start, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  if (isAllDay) {
    if (end && formatDate(end) !== formatDate(start)) return `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end)}`;
    return day;
  }
  const time = (d: Date) => formatDate(d, { hour: 'numeric', minute: '2-digit' });
  return end ? `${day}, ${time(start)} – ${time(end)}` : `${day}, ${time(start)}`;
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export const PHASE_LABELS: Record<string, string> = {
  PHASE_I: 'Phase I',
  PHASE_II: 'Phase II',
  PHASE_III: 'Phase III',
};

export const LEVEL_LABELS: Record<string, string> = {
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  POSTGRADUATE_DIPLOMA: 'Postgraduate diploma',
  DIPLOMA: 'Diploma',
  CERTIFICATE: 'Certificate',
  DOCTORAL: 'Doctoral',
};

export const isExternal = (url: string) => /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
