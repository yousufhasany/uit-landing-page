import type { Request } from 'express';
import type { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { removeFile, storeFile } from '../lib/storage.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { notFound } from '../utils/http.js';
import { toMediaDTO } from '../utils/media-dto.js';
import { paged, paginate } from '../utils/pagination.js';
import { slugify, uniqueSlug } from '../utils/slug.js';
import type { mediaListQuery, mediaUpdateSchema, mediaUploadFields } from '../validators/media.validators.js';
import { logActivity } from './activity.service.js';

type MediaRecord = NonNullable<Awaited<ReturnType<typeof mediaRepository.findById>>>;

export function serializeMedia(asset: MediaRecord) {
  return {
    ...toMediaDTO(asset)!,
    originalFilename: asset.originalFilename,
    provider: asset.provider,
    publicId: asset.publicId,
    fileSize: asset.fileSize,
    altText: asset.altText,
    description: asset.description,
    category: asset.category,
    folder: asset.folder,
    folderId: asset.folderId,
    tags: asset.tags.map((t) => t.tag.name),
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

async function syncTags(assetId: string, names: string[], tx: Prisma.TransactionClient) {
  await tx.mediaAssetTag.deleteMany({ where: { assetId } });
  for (const name of [...new Set(names.map((n) => n.trim()).filter(Boolean))]) {
    const slug = slugify(name);
    const tag = await tx.mediaTag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    await tx.mediaAssetTag.create({ data: { assetId, tagId: tag.id } });
  }
}

const SORTS = { createdAt: 'createdAt', name: 'originalFilename', size: 'fileSize' } as const;

export const mediaService = {
  async list(query: z.infer<typeof mediaListQuery>) {
    const where: Prisma.MediaAssetWhereInput = {
      type: query.type,
      category: query.category,
      folderId: query.folderId,
      tags: query.tag ? { some: { tag: { slug: slugify(query.tag) } } } : undefined,
      OR: query.q
        ? [
            { originalFilename: { contains: query.q, mode: 'insensitive' } },
            { altText: { contains: query.q, mode: 'insensitive' } },
            { caption: { contains: query.q, mode: 'insensitive' } },
            { tags: { some: { tag: { name: { contains: query.q, mode: 'insensitive' } } } } },
          ]
        : undefined,
    };
    const sortKey = SORTS[(query.sort as keyof typeof SORTS) ?? 'createdAt'] ?? 'createdAt';
    const [items, total] = await mediaRepository.list({ where, orderBy: { [sortKey]: query.order }, ...paginate(query) });
    return paged(items.map(serializeMedia), total, query.page, query.pageSize);
  },

  async get(id: string) {
    const asset = await mediaRepository.findById(id);
    if (!asset) throw notFound('Media');
    return { ...serializeMedia(asset), usage: await mediaRepository.usage(id) };
  },

  async upload(req: Request, file: Express.Multer.File, fields: z.infer<typeof mediaUploadFields>) {
    const stored = await storeFile(file.buffer, file.mimetype);
    const asset = await mediaRepository.create({
      ...stored,
      originalFilename: file.originalname.slice(0, 255),
      altText: fields.altText ?? '',
      caption: fields.caption,
      category: fields.category,
      folderId: fields.folderId,
      uploadedById: req.user?.id,
    });
    await logActivity(req, { action: 'UPLOAD', entityType: 'media', entityId: asset.id, summary: `Uploaded ${asset.originalFilename}` });
    return serializeMedia(asset);
  },

  /** Replaces the file while keeping the same record, so every reference updates automatically. */
  async replace(req: Request, id: string, file: Express.Multer.File) {
    const existing = await mediaRepository.findById(id);
    if (!existing) throw notFound('Media');
    const stored = await storeFile(file.buffer, file.mimetype);
    const asset = await mediaRepository.update(id, { ...stored, originalFilename: file.originalname.slice(0, 255) });
    await removeFile(existing.provider, existing.publicId, existing.type);
    await logActivity(req, { action: 'REPLACE', entityType: 'media', entityId: id, summary: `Replaced file for ${existing.originalFilename}` });
    return serializeMedia(asset);
  },

  async update(req: Request, id: string, input: z.infer<typeof mediaUpdateSchema>) {
    const { tags, ...data } = input;
    const asset = await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.update({ where: { id }, data });
      if (tags) await syncTags(id, tags, tx);
      return mediaRepository.findById(id, tx);
    });
    if (!asset) throw notFound('Media');
    await logActivity(req, { action: 'UPDATE', entityType: 'media', entityId: id, summary: `Updated details of ${asset.originalFilename}` });
    return serializeMedia(asset);
  },

  async remove(req: Request, id: string) {
    const asset = await mediaRepository.findById(id);
    if (!asset) throw notFound('Media');
    await mediaRepository.delete(id);
    await removeFile(asset.provider, asset.publicId, asset.type);
    await logActivity(req, { action: 'DELETE', entityType: 'media', entityId: id, summary: `Deleted ${asset.originalFilename}` });
  },

  async facets() {
    const [categories, folders, tags] = await Promise.all([
      mediaRepository.categories(),
      prisma.mediaFolder.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { assets: true } } } }),
      prisma.mediaTag.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { assets: true } } } }),
    ]);
    return {
      categories: categories.map((c) => ({ value: c.category!, count: c._count._all })),
      folders: folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId, count: f._count.assets })),
      tags: tags.map((t) => ({ name: t.name, slug: t.slug, count: t._count.assets })),
    };
  },

  async createFolder(req: Request, name: string, parentId?: string | null) {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.mediaFolder.findUnique({ where: { slug: s } })));
    const folder = await prisma.mediaFolder.create({ data: { name, slug, parentId: parentId ?? null } });
    await logActivity(req, { action: 'CREATE', entityType: 'media-folder', entityId: folder.id, summary: `Created media folder ${name}` });
    return folder;
  },

  async renameFolder(req: Request, id: string, name: string) {
    const folder = await prisma.mediaFolder.update({ where: { id }, data: { name } });
    await logActivity(req, { action: 'UPDATE', entityType: 'media-folder', entityId: id, summary: `Renamed media folder to ${name}` });
    return folder;
  },

  /** Files inside a deleted folder are kept and become unfiled. */
  async deleteFolder(req: Request, id: string) {
    const folder = await prisma.mediaFolder.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'media-folder', entityId: id, summary: `Deleted media folder ${folder.name}` });
  },
};

/** Resolves a set of media ids to public DTOs in a single query. */
export async function resolveMediaMap(ids: Iterable<string | null | undefined>) {
  const unique = [...new Set([...ids].filter((v): v is string => typeof v === 'string' && v.length > 0))];
  if (!unique.length) return new Map<string, ReturnType<typeof toMediaDTO>>();
  const assets = await mediaRepository.findManyByIds(unique);
  return new Map(assets.map((a) => [a.id, toMediaDTO(a)]));
}
