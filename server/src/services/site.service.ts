import { prisma } from '../lib/prisma.js';
import { publiclyVisible, publishedOnly } from '../utils/publication.js';

export const dashboardService = {
  async overview() {
    const now = new Date();
    const contentModels = ['page', 'newsArticle', 'event'] as const;
    const statusCounts = await Promise.all(
      contentModels.map((m) =>
        // Same groupBy on three models with identical status columns.
        (prisma[m] as unknown as { groupBy: (a: object) => Promise<{ status: string; _count: { _all: number } }[]> }).groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ),
    );
    const totals = { DRAFT: 0, PUBLISHED: 0, SCHEDULED: 0, ARCHIVED: 0 } as Record<string, number>;
    statusCounts.flat().forEach((row) => (totals[row.status] += row._count._all));

    const [news, upcomingEvents, programs, programsOffered, media, centers, pagesWithDrafts, homepageDraft, verification, recentActivity, recentNews, recentPages] =
      await Promise.all([
        prisma.newsArticle.count(),
        prisma.event.count({ where: { AND: [publiclyVisible(now), { OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }] }] } }),
        prisma.academicProgram.count({ where: { programStatus: { not: 'ARCHIVED' } } }),
        prisma.academicProgram.count({ where: { programStatus: 'ACTIVE' } }),
        prisma.mediaAsset.count(),
        prisma.center.count({ where: publishedOnly }),
        prisma.page.count({ where: { hasDraftChanges: true } }),
        prisma.homepageSection.count({ where: { OR: [{ hasDraftChanges: true }, { draftRemoved: true }] } }),
        Promise.all([
          prisma.page.count({ where: { needsVerification: true } }),
          prisma.center.count({ where: { needsVerification: true } }),
          prisma.faculty.count({ where: { needsVerification: true } }),
          prisma.contactInformation.count({ where: { needsVerification: true } }),
          prisma.campusItem.count({ where: { needsVerification: true } }),
        ]).then((n) => n.reduce((a, b) => a + b, 0)),
        prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
        prisma.newsArticle.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, updatedAt: true } }),
        prisma.page.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, updatedAt: true, hasDraftChanges: true } }),
      ]);

    return {
      content: { published: totals.PUBLISHED, draft: totals.DRAFT, scheduled: totals.SCHEDULED, archived: totals.ARCHIVED },
      news,
      upcomingEvents,
      programs,
      programsOffered,
      media,
      centers,
      pendingChanges: pagesWithDrafts + (homepageDraft > 0 ? 1 : 0),
      homepageHasDraft: homepageDraft > 0,
      needsVerification: verification,
      recentActivity,
      recentlyEdited: [
        ...recentNews.map((n) => ({ ...n, kind: 'news' as const })),
        ...recentPages.map((p) => ({ ...p, kind: 'page' as const })),
      ]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 8),
    };
  },
};

export const searchService = {
  async search(q: string) {
    const term = { contains: q, mode: 'insensitive' as const };
    const [pages, news, events, programs, centers, campus] = await Promise.all([
      prisma.page.findMany({ where: { ...publiclyVisible(), OR: [{ title: term }, { summary: term }] }, select: { title: true, slug: true, summary: true }, take: 6 }),
      prisma.newsArticle.findMany({ where: { ...publiclyVisible(), OR: [{ title: term }, { summary: term }] }, select: { title: true, slug: true, summary: true }, take: 6 }),
      prisma.event.findMany({ where: { ...publiclyVisible(), OR: [{ title: term }, { summary: term }] }, select: { title: true, slug: true, summary: true }, take: 6 }),
      prisma.academicProgram.findMany({
        where: { isVisible: true, programStatus: { not: 'ARCHIVED' }, faculty: publishedOnly, OR: [{ name: term }, { description: term }] },
        select: { name: true, slug: true, description: true, faculty: { select: { name: true } } },
        take: 8,
      }),
      prisma.center.findMany({ where: { ...publishedOnly, OR: [{ name: term }, { overview: term }, { acronym: term }] }, select: { name: true, slug: true, tagline: true }, take: 5 }),
      prisma.campusItem.findMany({ where: { ...publishedOnly, OR: [{ title: term }, { description: term }] }, select: { title: true, description: true, category: true }, take: 5 }),
    ]);
    const campusUrl = (category: string) =>
      category === 'TEMPORARY_CAMPUS' ? '/campus/temporary-campus' : category === 'KNOWLEDGE_CITY' ? '/campus/knowledge-city' : '/campus/development';
    return [
      ...pages.map((p) => ({ type: 'Page', title: p.title, url: `/${p.slug}`, excerpt: p.summary })),
      ...programs.map((p) => ({ type: 'Program', title: p.name, url: `/academics/programs/${p.slug}`, excerpt: p.description ?? p.faculty.name })),
      ...centers.map((c) => ({ type: 'Center', title: c.name, url: `/centers/${c.slug}`, excerpt: c.tagline })),
      ...campus.map((c) => ({ type: 'Campus', title: c.title, url: campusUrl(c.category), excerpt: c.description })),
      ...news.map((n) => ({ type: 'News', title: n.title, url: `/news/${n.slug}`, excerpt: n.summary })),
      ...events.map((e) => ({ type: 'Event', title: e.title, url: `/events/${e.slug}`, excerpt: e.summary })),
    ];
  },
};

const STATIC_ROUTES = ['/', '/academics', '/academics/programs', '/academics/faculties', '/academics/departments', '/research/projects', '/research/publications', '/centers', '/campus/gallery', '/news', '/events', '/contact'];

export async function buildSitemap(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, '');
  const [pages, news, events, programs, centers, galleries] = await Promise.all([
    prisma.page.findMany({ where: publiclyVisible(), select: { slug: true, updatedAt: true } }),
    prisma.newsArticle.findMany({ where: publiclyVisible(), select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ where: publiclyVisible(), select: { slug: true, updatedAt: true } }),
    prisma.academicProgram.findMany({ where: { isVisible: true, programStatus: { not: 'ARCHIVED' }, faculty: publishedOnly }, select: { slug: true, updatedAt: true } }),
    prisma.center.findMany({ where: publishedOnly, select: { slug: true, updatedAt: true } }),
    prisma.gallery.findMany({ where: publiclyVisible(), select: { slug: true, updatedAt: true } }),
  ]);
  const urls = new Map<string, Date | null>(STATIC_ROUTES.map((r) => [r, null]));
  pages.forEach((p) => urls.set(`/${p.slug}`, p.updatedAt));
  news.forEach((n) => urls.set(`/news/${n.slug}`, n.updatedAt));
  events.forEach((e) => urls.set(`/events/${e.slug}`, e.updatedAt));
  programs.forEach((p) => urls.set(`/academics/programs/${p.slug}`, p.updatedAt));
  centers.forEach((c) => urls.set(`/centers/${c.slug}`, c.updatedAt));
  galleries.forEach((g) => urls.set(`/campus/gallery/${g.slug}`, g.updatedAt));
  const body = [...urls]
    .map(([path, updated]) => `  <url><loc>${base}${path === '/' ? '' : path}</loc>${updated ? `<lastmod>${updated.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
