import type { Request } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { notFound } from '../utils/http.js';
import { toMediaDTO } from '../utils/media-dto.js';
import { normalizePublication, publiclyVisible } from '../utils/publication.js';
import { uniqueSlug } from '../utils/slug.js';
import { statusEnum } from '../validators/news-events.validators.js';
import { logActivity } from './activity.service.js';

export const galleryInput = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  description: z.string().trim().max(1000).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  coverImageId: z.string().uuid().nullable().optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  status: statusEnum.default('DRAFT'),
  publishedAt: z.coerce.date().nullable().optional(),
});

export const galleryItemsInput = z.object({ mediaIds: z.array(z.string().uuid()).min(1).max(100) });
export const galleryItemUpdate = z.object({
  caption: z.string().trim().max(500).nullable().optional(),
  altText: z.string().trim().max(300).nullable().optional(),
});

const itemInclude = { media: true } satisfies Prisma.GalleryItemInclude;
type Item = Prisma.GalleryItemGetPayload<{ include: typeof itemInclude }>;

export function galleryItemDTO(item: Item) {
  const media = toMediaDTO(item.media)!;
  return { id: item.id, mediaId: item.mediaId, caption: item.caption ?? media.caption, alt: item.altText || media.alt, media, displayOrder: item.displayOrder };
}

const albumInclude = {
  coverImage: true,
  items: { include: itemInclude, orderBy: { displayOrder: 'asc' }, take: 1 },
  _count: { select: { items: true } },
} satisfies Prisma.GalleryInclude;
type Album = Prisma.GalleryGetPayload<{ include: typeof albumInclude }>;

function albumCard(g: Album) {
  return {
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    category: g.category,
    status: g.status,
    publishedAt: g.publishedAt,
    displayOrder: g.displayOrder,
    itemCount: g._count.items,
    cover: toMediaDTO(g.coverImage) ?? (g.items[0] ? toMediaDTO(g.items[0].media) : null),
  };
}

const slugTaken = (excludeId?: string) => async (slug: string) =>
  Boolean(await prisma.gallery.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } }));

export const galleryService = {
  async listPublic(category?: string) {
    const albums = await prisma.gallery.findMany({
      where: { AND: [publiclyVisible(), category ? { category } : {}] },
      include: albumInclude,
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return albums.filter((a) => a._count.items > 0).map(albumCard);
  },

  async getPublic(slug: string) {
    const album = await prisma.gallery.findFirst({
      where: { slug, ...publiclyVisible() },
      include: { coverImage: true, items: { include: itemInclude, orderBy: { displayOrder: 'asc' } } },
    });
    if (!album) throw notFound('Album');
    return { id: album.id, title: album.title, slug: album.slug, description: album.description, category: album.category, items: album.items.map(galleryItemDTO) };
  },

  /** Items for the homepage gallery: one album, or the latest across all published albums. */
  async featuredItems(galleryId: string | null, limit: number) {
    const items = await prisma.galleryItem.findMany({
      where: { gallery: { ...publiclyVisible(), ...(galleryId ? { id: galleryId } : {}) } },
      include: { ...itemInclude, gallery: { select: { slug: true, title: true } } },
      orderBy: [{ gallery: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
      take: limit,
    });
    return items.map((i) => ({ ...galleryItemDTO(i), album: i.gallery }));
  },

  async listAdmin() {
    const albums = await prisma.gallery.findMany({ include: albumInclude, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
    return albums.map(albumCard);
  },

  async getAdmin(id: string) {
    const album = await prisma.gallery.findUnique({
      where: { id },
      include: { coverImage: true, items: { include: itemInclude, orderBy: { displayOrder: 'asc' } } },
    });
    if (!album) throw notFound('Album');
    return { ...album, coverImage: toMediaDTO(album.coverImage), items: album.items.map(galleryItemDTO) };
  },

  async create(req: Request, input: z.infer<typeof galleryInput>) {
    const album = await prisma.gallery.create({
      data: { ...input, ...normalizePublication(input.status, input.publishedAt, null), slug: await uniqueSlug(input.slug || input.title, slugTaken()) },
    });
    await logActivity(req, { action: 'CREATE', entityType: 'gallery', entityId: album.id, summary: `Created gallery album "${album.title}"` });
    return this.getAdmin(album.id);
  },

  async update(req: Request, id: string, input: z.infer<typeof galleryInput>) {
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw notFound('Album');
    const slug = input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, slugTaken(id)) : existing.slug;
    await prisma.gallery.update({ where: { id }, data: { ...input, slug, ...normalizePublication(input.status, input.publishedAt, existing.publishedAt) } });
    await logActivity(req, { action: 'UPDATE', entityType: 'gallery', entityId: id, summary: `Updated gallery album "${input.title}"` });
    return this.getAdmin(id);
  },

  async remove(req: Request, id: string) {
    const album = await prisma.gallery.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'gallery', entityId: id, summary: `Deleted gallery album "${album.title}" (media files kept)` });
  },

  async addItems(req: Request, id: string, mediaIds: string[]) {
    const max = await prisma.galleryItem.aggregate({ where: { galleryId: id }, _max: { displayOrder: true } });
    let next = (max._max.displayOrder ?? -1) + 1;
    await prisma.galleryItem.createMany({ data: mediaIds.map((mediaId) => ({ galleryId: id, mediaId, displayOrder: next++ })), skipDuplicates: true });
    await logActivity(req, { action: 'UPDATE', entityType: 'gallery', entityId: id, summary: `Added ${mediaIds.length} images to a gallery album` });
    return this.getAdmin(id);
  },

  async updateItem(req: Request, itemId: string, input: z.infer<typeof galleryItemUpdate>) {
    const item = await prisma.galleryItem.update({ where: { id: itemId }, data: input });
    await logActivity(req, { action: 'UPDATE', entityType: 'gallery', entityId: item.galleryId, summary: 'Edited a gallery caption' });
    return item;
  },

  async removeItem(req: Request, itemId: string) {
    const item = await prisma.galleryItem.delete({ where: { id: itemId } });
    await logActivity(req, { action: 'UPDATE', entityType: 'gallery', entityId: item.galleryId, summary: 'Removed an image from a gallery album' });
  },

  async reorderItems(req: Request, id: string, itemIds: string[]) {
    await prisma.$transaction(itemIds.map((itemId, index) => prisma.galleryItem.update({ where: { id: itemId, galleryId: id }, data: { displayOrder: index } })));
    await logActivity(req, { action: 'REORDER', entityType: 'gallery', entityId: id, summary: 'Reordered gallery images' });
    return this.getAdmin(id);
  },
};
