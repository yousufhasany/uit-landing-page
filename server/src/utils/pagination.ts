import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

export function paginate({ page, pageSize }: { page: number; pageSize: number }) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Restricts a user-supplied sort key to an allow-list, falling back to the first entry. */
export function sortBy<K extends string>(sort: string | undefined, allowed: readonly K[], order: 'asc' | 'desc') {
  const key = (allowed as readonly string[]).includes(sort ?? '') ? (sort as K) : allowed[0];
  return { [key]: order } as Record<K, 'asc' | 'desc'>;
}
