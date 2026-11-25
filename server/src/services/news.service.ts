import type { Request } from 'express';
import type { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { notFound } from '../utils/http.js';
import { toMediaDTO } from '../utils/media-dto.js';
import { paged, paginate } from '../utils/pagination.js';
import { normalizePublication, publiclyVisible, type StatusValue } from '../utils/publication.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { slugify, uniqueSlug } from '../utils/slug.js';
import type { categoryInput, newsInput, newsListQuery } from '../validators/news-events.validators.js';
import { logActivity } from './activity.service.js';
import { assertPublishRights, saveRevision } from './revision.service.js';

const include = {
  featuredImage: true,
  category: true,
  author: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.NewsArticleInclude;

type Article = Prisma.NewsArticleGetPayload<{ include: typeof include }>;

export function newsCard(a: Article) {
  const image = toMediaDTO(a.featuredImage);
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    publishedAt: a.publishedAt,
    isFeatured: a.isFeatured,
    category: a.category ? { name: a.category.name, slug: a.category.slug } : null,
    image: image ? { ...image, alt: a.imageAlt || image.alt } : null,
  };
}

function adminView(a: Article) {
  return { ...a, featuredImage: toMediaDTO(a.featuredImage), tags: a.tags.map((t) => t.tag.name) };
}

async function syncTags(articleId: string, names: string[], tx: Prisma.TransactionClient) {
  await tx.newsArticleTag.deleteMany({ where: { articleId } });
  for (const name of [...new Set(names)]) {
    const slug = slugify(name);
    const tag = await tx.newsTag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    await tx.newsArticleTag.create({ data: { articleId, tagId: tag.id } });
  }
}

const slugTaken = (excludeId?: string) => async (slug: string) =>
  Boolean(await prisma.newsArticle.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } }));

function listWhere(query: z.infer<typeof newsListQuery>, publicOnly: boolean): Prisma.NewsArticleWhereInput {
  return {
    AND: [
      publicOnly ? publiclyVisible() : query.status ? { status: query.status } : {},
      query.category ? { category: { slug: query.category } } : {},
      query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {},
      query.featured ? { isFeatured: query.featured === 'true' } : {},
      query.q
        ? { OR: [{ title: { contains: query.q, mode: 'insensitive' } }, { summary: { contains: query.q, mode: 'insensitive' } }] }
        : {},
    ],
  };
}

export const newsService = {
  async listPublic(query: z.infer<typeof newsListQuery>) {
    const where = listWhere(query, true);
    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({ where, include, orderBy: [{ publishedAt: 'desc' }], ...paginate(query) }),
      prisma.newsArticle.count({ where }),
    ]);
    return paged(items.map(newsCard), total, query.page, query.pageSize);
  },

  async latestPublic(limit: number) {
    const items = await prisma.newsArticle.findMany({ where: publiclyVisible(), include, orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }], take: limit });
    return items.map(newsCard);
  },

  async getPublic(slug: string) {
    const article = await prisma.newsArticle.findFirst({ where: { slug, ...publiclyVisible() }, include });
    if (!article) throw notFound('Article');
    const related = await prisma.newsArticle.findMany({
      where: { ...publiclyVisible(), id: { not: article.id }, categoryId: article.categoryId ?? undefined },
      include,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return {
      ...newsCard(article),
      content: article.content,
      tags: article.tags.map((t) => t.tag.name),
      author: article.author?.name ?? null,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      updatedAt: article.updatedAt,
      related: related.map(newsCard),
    };
  },

  async listAdmin(query: z.infer<typeof newsListQuery>) {
    const where = listWhere(query, false);
    const orderBy: Prisma.NewsArticleOrderByWithRelationInput =
      query.sort === 'title' ? { title: query.order } : query.sort === 'publishedAt' ? { publishedAt: query.order } : { updatedAt: query.order };
    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({ where, include, orderBy, ...paginate(query) }),
      prisma.newsArticle.count({ where }),
    ]);
    return paged(items.map(adminView), total, query.page, query.pageSize);
  },

  async getAdmin(id: string) {
    const article = await prisma.newsArticle.findUnique({ where: { id }, include });
    if (!article) throw notFound('Article');
    return adminView(article);
  },

  async create(req: Request, input: z.infer<typeof newsInput>) {
    assertPublishRights(req, 'news.publish', null, input.status);
    const { tags, ...data } = input;
    const publication = normalizePublication(input.status, input.publishedAt, null);
    const slug = input.slug ? await uniqueSlug(input.slug, slugTaken()) : await uniqueSlug(input.title, slugTaken());
    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.newsArticle.create({
        data: { ...data, ...publication, slug, content: sanitizeRichText(data.content), authorId: req.user?.id },
      });
      await syncTags(created.id, tags, tx);
      if (publication.status !== 'DRAFT') await saveRevision('NEWS', created.id, { ...input }, req.user?.id, `Created as ${publication.status}`, tx);
      return tx.newsArticle.findUniqueOrThrow({ where: { id: created.id }, include });
    });
    await logActivity(req, { action: 'CREATE', entityType: 'news', entityId: article.id, summary: `Created news "${article.title}"` });
    return adminView(article);
  },

  async update(req: Request, id: string, input: z.infer<typeof newsInput>) {
    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw notFound('Article');
    assertPublishRights(req, 'news.publish', existing.status as StatusValue, input.status);
    const { tags, ...data } = input;
    const publication = normalizePublication(input.status, input.publishedAt, existing.publishedAt);
    const slug = input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, slugTaken(id)) : existing.slug;
    const article = await prisma.$transaction(async (tx) => {
      await tx.newsArticle.update({ where: { id }, data: { ...data, ...publication, slug, content: sanitizeRichText(data.content) } });
      await syncTags(id, tags, tx);
      await saveRevision('NEWS', id, { ...input, slug }, req.user?.id, `Saved as ${publication.status}`, tx);
      return tx.newsArticle.findUniqueOrThrow({ where: { id }, include });
    });
    const action = existing.status !== publication.status ? (publication.status === 'PUBLISHED' ? 'PUBLISH' : 'STATUS') : 'UPDATE';
    await logActivity(req, { action, entityType: 'news', entityId: id, summary: `${action === 'UPDATE' ? 'Updated' : `Set to ${publication.status}`}: "${article.title}"` });
    return adminView(article);
  },

  async setStatus(req: Request, id: string, status: StatusValue, publishedAt?: Date | null) {
    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw notFound('Article');
    assertPublishRights(req, 'news.publish', existing.status as StatusValue, status);
    const publication = normalizePublication(status, publishedAt, existing.publishedAt);
    const article = await prisma.newsArticle.update({ where: { id }, data: publication, include });
    await logActivity(req, { action: status === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH', entityType: 'news', entityId: id, summary: `Set "${article.title}" to ${publication.status}` });
    return adminView(article);
  },

  async remove(req: Request, id: string) {
    const article = await prisma.newsArticle.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'news', entityId: id, summary: `Deleted news "${article.title}"` });
  },

  categories: () => prisma.newsCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { articles: true } } } }),

  async createCategory(req: Request, input: z.infer<typeof categoryInput>) {
    const category = await prisma.newsCategory.create({ data: { ...input, slug: slugify(input.name) } });
    await logActivity(req, { action: 'CREATE', entityType: 'news-category', entityId: category.id, summary: `Created news category ${category.name}` });
    return category;
  },

  async updateCategory(req: Request, id: string, input: z.infer<typeof categoryInput>) {
    const category = await prisma.newsCategory.update({ where: { id }, data: { ...input, slug: slugify(input.name) } });
    await logActivity(req, { action: 'UPDATE', entityType: 'news-category', entityId: id, summary: `Updated news category ${category.name}` });
    return category;
  },

  /** Articles in a deleted category are kept and become uncategorised. */
  async deleteCategory(req: Request, id: string) {
    const category = await prisma.newsCategory.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'news-category', entityId: id, summary: `Deleted news category ${category.name}` });
  },
};
