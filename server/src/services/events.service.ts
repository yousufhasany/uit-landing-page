import type { Request } from 'express';
import type { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { notFound } from '../utils/http.js';
import { toMediaDTO } from '../utils/media-dto.js';
import { paged, paginate } from '../utils/pagination.js';
import { normalizePublication, publiclyVisible, type StatusValue } from '../utils/publication.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { slugify, uniqueSlug } from '../utils/slug.js';
import type { categoryInput, eventInput, eventListQuery } from '../validators/news-events.validators.js';
import { logActivity } from './activity.service.js';
import { assertPublishRights, saveRevision } from './revision.service.js';

const include = { featuredImage: true, category: true } satisfies Prisma.EventInclude;
type EventRecord = Prisma.EventGetPayload<{ include: typeof include }>;

export function eventCard(e: EventRecord) {
  const image = toMediaDTO(e.featuredImage);
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    summary: e.summary,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    isAllDay: e.isAllDay,
    venue: e.venue,
    registrationUrl: e.registrationUrl,
    isFeatured: e.isFeatured,
    category: e.category ? { name: e.category.name, slug: e.category.slug } : null,
    image: image ? { ...image, alt: e.imageAlt || image.alt } : null,
  };
}

const adminView = (e: EventRecord) => ({ ...e, featuredImage: toMediaDTO(e.featuredImage) });

const slugTaken = (excludeId?: string) => async (slug: string) =>
  Boolean(await prisma.event.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } }));

function timeFilter(when: 'upcoming' | 'past' | 'all'): Prisma.EventWhereInput {
  const now = new Date();
  if (when === 'upcoming') return { OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }] };
  if (when === 'past') return { AND: [{ startsAt: { lt: now } }, { OR: [{ endsAt: null }, { endsAt: { lt: now } }] }] };
  return {};
}

function listWhere(query: z.infer<typeof eventListQuery>, publicOnly: boolean): Prisma.EventWhereInput {
  return {
    AND: [
      publicOnly ? publiclyVisible() : query.status ? { status: query.status } : {},
      timeFilter(query.when),
      query.category ? { category: { slug: query.category } } : {},
      query.featured ? { isFeatured: query.featured === 'true' } : {},
      query.q ? { OR: [{ title: { contains: query.q, mode: 'insensitive' } }, { venue: { contains: query.q, mode: 'insensitive' } }] } : {},
    ],
  };
}

export const eventsService = {
  async listPublic(query: z.infer<typeof eventListQuery>) {
    const where = listWhere(query, true);
    const orderBy = { startsAt: query.when === 'past' ? 'desc' : 'asc' } as const;
    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, include, orderBy, ...paginate(query) }),
      prisma.event.count({ where }),
    ]);
    return paged(items.map(eventCard), total, query.page, query.pageSize);
  },

  async upcomingPublic(limit: number) {
    const items = await prisma.event.findMany({
      where: { AND: [publiclyVisible(), timeFilter('upcoming')] },
      include,
      orderBy: [{ isFeatured: 'desc' }, { startsAt: 'asc' }],
      take: limit,
    });
    return items.map(eventCard);
  },

  async getPublic(slug: string) {
    const event = await prisma.event.findFirst({ where: { slug, ...publiclyVisible() }, include });
    if (!event) throw notFound('Event');
    return { ...eventCard(event), description: event.description, seoTitle: event.seoTitle, seoDescription: event.seoDescription };
  },

  async listAdmin(query: z.infer<typeof eventListQuery>) {
    const where = listWhere(query, false);
    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, include, orderBy: { startsAt: query.order }, ...paginate(query) }),
      prisma.event.count({ where }),
    ]);
    return paged(items.map(adminView), total, query.page, query.pageSize);
  },

  async getAdmin(id: string) {
    const event = await prisma.event.findUnique({ where: { id }, include });
    if (!event) throw notFound('Event');
    return adminView(event);
  },

  async create(req: Request, input: z.infer<typeof eventInput>) {
    assertPublishRights(req, 'events.publish', null, input.status);
    const publication = normalizePublication(input.status, input.publishedAt, null);
    const slug = await uniqueSlug(input.slug || input.title, slugTaken());
    const event = await prisma.event.create({
      data: { ...input, ...publication, slug, description: sanitizeRichText(input.description), authorId: req.user?.id },
      include,
    });
    await logActivity(req, { action: 'CREATE', entityType: 'event', entityId: event.id, summary: `Created event "${event.title}"` });
    return adminView(event);
  },

  async update(req: Request, id: string, input: z.infer<typeof eventInput>) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw notFound('Event');
    assertPublishRights(req, 'events.publish', existing.status as StatusValue, input.status);
    const publication = normalizePublication(input.status, input.publishedAt, existing.publishedAt);
    const slug = input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, slugTaken(id)) : existing.slug;
    const event = await prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id },
        data: { ...input, ...publication, slug, description: sanitizeRichText(input.description) },
        include,
      });
      await saveRevision('EVENT', id, { ...input, slug }, req.user?.id, `Saved as ${publication.status}`, tx);
      return updated;
    });
    await logActivity(req, { action: 'UPDATE', entityType: 'event', entityId: id, summary: `Updated event "${event.title}" (${publication.status})` });
    return adminView(event);
  },

  async setStatus(req: Request, id: string, status: StatusValue, publishedAt?: Date | null) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw notFound('Event');
    assertPublishRights(req, 'events.publish', existing.status as StatusValue, status);
    const event = await prisma.event.update({ where: { id }, data: normalizePublication(status, publishedAt, existing.publishedAt), include });
    await logActivity(req, { action: status === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH', entityType: 'event', entityId: id, summary: `Set event "${event.title}" to ${event.status}` });
    return adminView(event);
  },

  async remove(req: Request, id: string) {
    const event = await prisma.event.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'event', entityId: id, summary: `Deleted event "${event.title}"` });
  },

  categories: () => prisma.eventCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { events: true } } } }),

  async createCategory(req: Request, input: z.infer<typeof categoryInput>) {
    const category = await prisma.eventCategory.create({ data: { name: input.name, slug: slugify(input.name) } });
    await logActivity(req, { action: 'CREATE', entityType: 'event-category', entityId: category.id, summary: `Created event category ${category.name}` });
    return category;
  },

  async updateCategory(req: Request, id: string, input: z.infer<typeof categoryInput>) {
    const category = await prisma.eventCategory.update({ where: { id }, data: { name: input.name, slug: slugify(input.name) } });
    await logActivity(req, { action: 'UPDATE', entityType: 'event-category', entityId: id, summary: `Updated event category ${category.name}` });
    return category;
  },

  async deleteCategory(req: Request, id: string) {
    const category = await prisma.eventCategory.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'event-category', entityId: id, summary: `Deleted event category ${category.name}` });
  },
};
