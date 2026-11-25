import type { Request } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../lib/prisma.js';
import { forbidden, notFound } from '../utils/http.js';
import { toMediaDTO } from '../utils/media-dto.js';
import { paged, paginate, paginationQuery } from '../utils/pagination.js';
import { normalizePublication, publiclyVisible } from '../utils/publication.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { uniqueSlug } from '../utils/slug.js';
import { collectMediaIds, pageBlockInput } from '../validators/content-blocks.js';
import { statusEnum } from '../validators/news-events.validators.js';
import { logActivity } from './activity.service.js';
import { resolveMediaMap } from './media.service.js';
import { listRevisions, saveRevision } from './revision.service.js';

const pageSlug = z
  .string()
  .trim()
  .max(160)
  .regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/, 'Use lowercase letters, numbers, hyphens and / for sub-pages');

export const pageContentInput = z.object({
  title: z.string().trim().min(2).max(200),
  slug: pageSlug,
  eyebrow: z.string().trim().max(80).nullable().optional(),
  summary: z.string().trim().max(600).nullable().optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  template: z.enum(['standard', 'landing', 'listing']).default('standard'),
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(170).nullable().optional(),
  needsVerification: z.boolean().default(false),
  verificationNote: z.string().trim().max(500).nullable().optional(),
  blocks: z.array(pageBlockInput).max(80).default([]),
});
export type PageContent = z.infer<typeof pageContentInput>;

export const pageCreateInput = pageContentInput.partial({ slug: true });
export const pagePublishInput = z.object({ content: pageContentInput.optional(), publishedAt: z.coerce.date().nullable().optional() });
export const pageListQuery = paginationQuery.extend({ status: statusEnum.optional() });

const include = {
  sections: { orderBy: { order: 'asc' } },
  featuredImage: true,
  author: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.PageInclude;
type PageRecord = Prisma.PageGetPayload<{ include: typeof include }>;

const LIVE = ['PUBLISHED', 'SCHEDULED'];

function sanitizeBlocks(blocks: PageContent['blocks']) {
  return blocks.map((b) => (b.type === 'RICH_TEXT' ? { ...b, data: { ...b.data, html: sanitizeRichText(String(b.data.html ?? '')) } } : b));
}

function currentContent(page: PageRecord): PageContent {
  return {
    title: page.title,
    slug: page.slug,
    eyebrow: page.eyebrow,
    summary: page.summary,
    featuredImageId: page.featuredImageId,
    template: page.template as PageContent['template'],
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    needsVerification: page.needsVerification,
    verificationNote: page.verificationNote,
    blocks: page.sections.map((s) => ({ id: s.id, type: s.type, data: s.data as Record<string, unknown> })),
  };
}

/** Shape rendered by the public site and by preview. */
async function renderable(content: PageContent, meta: { id: string; status: string; publishedAt: Date | null; updatedAt: Date }) {
  const mediaIds = [content.featuredImageId, ...content.blocks.flatMap((b) => collectMediaIds(b.data))];
  const media = await resolveMediaMap(mediaIds);
  return {
    id: meta.id,
    status: meta.status,
    publishedAt: meta.publishedAt,
    updatedAt: meta.updatedAt,
    title: content.title,
    slug: content.slug,
    eyebrow: content.eyebrow,
    summary: content.summary,
    template: content.template,
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    featuredImage: content.featuredImageId ? media.get(content.featuredImageId) ?? null : null,
    blocks: content.blocks.map((b, i) => ({ id: b.id ?? `b${i}`, type: b.type, data: b.data })),
    media: Object.fromEntries(media),
  };
}

const slugTaken = (excludeId?: string) => async (slug: string) =>
  Boolean(await prisma.page.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } }));

async function applyContent(tx: Prisma.TransactionClient, id: string, content: PageContent, userId: string | undefined, extra: Prisma.PageUncheckedUpdateInput = {}) {
  const { blocks, ...fields } = content;
  await tx.page.update({ where: { id }, data: { ...fields, ...extra, updatedById: userId, draftData: Prisma.DbNull, hasDraftChanges: false } });
  await tx.pageSection.deleteMany({ where: { pageId: id } });
  if (blocks.length) {
    await tx.pageSection.createMany({ data: sanitizeBlocks(blocks).map((b, order) => ({ pageId: id, type: b.type, data: b.data as Prisma.InputJsonValue, order })) });
  }
}

function adminView(page: PageRecord) {
  const draft = page.draftData as PageContent | null;
  return {
    id: page.id,
    status: page.status,
    publishedAt: page.publishedAt,
    hasDraftChanges: page.hasDraftChanges,
    author: page.author,
    updatedBy: page.updatedBy,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    published: currentContent(page),
    /** What the editor should load: the working copy if one exists. */
    content: draft ?? currentContent(page),
    featuredImage: toMediaDTO(page.featuredImage),
  };
}

export const pagesService = {
  async getPublic(slug: string) {
    const page = await prisma.page.findFirst({ where: { slug, ...publiclyVisible() }, include });
    if (!page) throw notFound('Page');
    return renderable(currentContent(page), page);
  },

  async listAdmin(query: z.infer<typeof pageListQuery>) {
    const where: Prisma.PageWhereInput = {
      status: query.status,
      OR: query.q ? [{ title: { contains: query.q, mode: 'insensitive' } }, { slug: { contains: query.q, mode: 'insensitive' } }] : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: query.sort === 'title' ? { title: query.order } : query.sort === 'slug' ? { slug: 'asc' } : { updatedAt: query.order },
        select: { id: true, title: true, slug: true, status: true, publishedAt: true, hasDraftChanges: true, needsVerification: true, updatedAt: true, updatedBy: { select: { name: true } } },
        ...paginate(query),
      }),
      prisma.page.count({ where }),
    ]);
    return paged(items, total, query.page, query.pageSize);
  },

  async getAdmin(id: string) {
    const page = await prisma.page.findUnique({ where: { id }, include });
    if (!page) throw notFound('Page');
    return { ...adminView(page), revisions: await listRevisions('PAGE', id) };
  },

  async preview(id: string) {
    const page = await prisma.page.findUnique({ where: { id }, include });
    if (!page) throw notFound('Page');
    return renderable((page.draftData as PageContent | null) ?? currentContent(page), page);
  },

  async create(req: Request, input: z.infer<typeof pageCreateInput>) {
    const slug = await uniqueSlug(input.slug || input.title!, slugTaken(), true);
    const content = pageContentInput.parse({ ...input, slug });
    const page = await prisma.$transaction(async (tx) => {
      const { blocks, ...fields } = content;
      const created = await tx.page.create({ data: { ...fields, status: 'DRAFT', authorId: req.user?.id, updatedById: req.user?.id } });
      await applyContent(tx, created.id, content, req.user?.id);
      return tx.page.findUniqueOrThrow({ where: { id: created.id }, include });
    });
    await logActivity(req, { action: 'CREATE', entityType: 'page', entityId: page.id, summary: `Created page "${page.title}"` });
    return adminView(page);
  },

  /**
   * Saves editor content. Draft pages are updated in place; for live pages the content is stored as a
   * working copy so the public page is untouched until it is published.
   */
  async saveDraft(req: Request, id: string, content: PageContent) {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) throw notFound('Page');
    if (content.slug !== page.slug && (await slugTaken(id)(content.slug))) content.slug = await uniqueSlug(content.slug, slugTaken(id), true);
    const live = LIVE.includes(page.status);
    await prisma.$transaction(async (tx) => {
      if (live) {
        await tx.page.update({
          where: { id },
          data: { draftData: { ...content, blocks: sanitizeBlocks(content.blocks) } as Prisma.InputJsonValue, hasDraftChanges: true, updatedById: req.user?.id },
        });
      } else {
        await applyContent(tx, id, content, req.user?.id);
      }
    });
    await logActivity(req, { action: 'SAVE_DRAFT', entityType: 'page', entityId: id, summary: `Saved draft of "${content.title}"` });
    return this.getAdmin(id);
  },

  async publish(req: Request, id: string, input: z.infer<typeof pagePublishInput>) {
    const page = await prisma.page.findUnique({ where: { id }, include });
    if (!page) throw notFound('Page');
    const content = input.content ?? (page.draftData as PageContent | null) ?? currentContent(page);
    if (content.slug !== page.slug && (await slugTaken(id)(content.slug))) content.slug = await uniqueSlug(content.slug, slugTaken(id), true);
    const publication = normalizePublication(input.publishedAt ? 'SCHEDULED' : 'PUBLISHED', input.publishedAt, page.publishedAt);
    await prisma.$transaction(async (tx) => {
      await applyContent(tx, id, content, req.user?.id, publication);
      await saveRevision('PAGE', id, content as unknown as Prisma.InputJsonValue, req.user?.id, publication.status === 'SCHEDULED' ? 'Scheduled' : 'Published', tx);
    });
    await logActivity(req, { action: 'PUBLISH', entityType: 'page', entityId: id, summary: `${publication.status === 'SCHEDULED' ? 'Scheduled' : 'Published'} page "${content.title}"` });
    return this.getAdmin(id);
  },

  async unpublish(req: Request, id: string, archive = false) {
    const page = await prisma.page.findUnique({ where: { id }, include });
    if (!page) throw notFound('Page');
    const content = (page.draftData as PageContent | null) ?? currentContent(page);
    await prisma.$transaction((tx) => applyContent(tx, id, content, req.user?.id, { status: archive ? 'ARCHIVED' : 'DRAFT' }));
    await logActivity(req, { action: 'UNPUBLISH', entityType: 'page', entityId: id, summary: `${archive ? 'Archived' : 'Unpublished'} page "${page.title}"` });
    return this.getAdmin(id);
  },

  async discardDraft(req: Request, id: string) {
    await prisma.page.update({ where: { id }, data: { draftData: Prisma.DbNull, hasDraftChanges: false } });
    await logActivity(req, { action: 'DISCARD_DRAFT', entityType: 'page', entityId: id, summary: 'Discarded unpublished page changes' });
    return this.getAdmin(id);
  },

  /** Loads a previous version into the working copy (never directly onto the live page). */
  async restoreRevision(req: Request, id: string, revisionId: string) {
    const revision = await prisma.contentRevision.findFirst({ where: { id: revisionId, entityType: 'PAGE', entityId: id } });
    if (!revision) throw notFound('Revision');
    const content = pageContentInput.parse(revision.snapshot);
    return this.saveDraft(req, id, content);
  },

  async remove(req: Request, id: string) {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) throw notFound('Page');
    if (LIVE.includes(page.status) && !req.user?.permissions.has('pages.publish')) throw forbidden('Unpublish the page before deleting it');
    await prisma.page.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'page', entityId: id, summary: `Deleted page "${page.title}"` });
  },
};
