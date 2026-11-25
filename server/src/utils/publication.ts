import { badRequest } from './http.js';

/**
 * Public visibility rule shared by every content type with a ContentStatus and publishedAt:
 * PUBLISHED items whose publish date has passed (or is unset), and SCHEDULED items whose time has arrived.
 */
export function publiclyVisible(now = new Date()) {
  return {
    OR: [
      { status: 'PUBLISHED' as const, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { status: 'SCHEDULED' as const, publishedAt: { lte: now } },
    ],
  };
}

/** For models without publishedAt (faculties, centers, campus…), only PUBLISHED is public. */
export const publishedOnly = { status: 'PUBLISHED' as const };

export type StatusValue = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

/**
 * Resolves the stored status/publishedAt pair. A PUBLISHED request with a future date becomes SCHEDULED;
 * SCHEDULED requires a date.
 */
export function normalizePublication(
  status: StatusValue,
  requested: Date | null | undefined,
  current: Date | null | undefined,
): { status: StatusValue; publishedAt: Date | null } {
  const now = new Date();
  if (status === 'SCHEDULED') {
    const at = requested ?? current;
    if (!at) throw badRequest('A publish date is required to schedule content');
    return at <= now ? { status: 'PUBLISHED', publishedAt: at } : { status: 'SCHEDULED', publishedAt: at };
  }
  if (status === 'PUBLISHED') {
    const at = requested ?? current ?? now;
    return at > now ? { status: 'SCHEDULED', publishedAt: at } : { status: 'PUBLISHED', publishedAt: at };
  }
  return { status, publishedAt: requested ?? current ?? null };
}
