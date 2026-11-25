import type { Request } from 'express';
import { z } from 'zod';
import { prisma, type HomepageSection, type HomepageSectionType, type Prisma } from '../lib/prisma.js';
import { badRequest, notFound } from '../utils/http.js';
import { HOMEPAGE_SECTION_SCHEMAS, HOMEPAGE_VARIANTS, collectMediaIds, type HomepageSectionTypeKey } from '../validators/content-blocks.js';
import { logActivity } from './activity.service.js';
import { eventsService } from './events.service.js';
import { galleryService } from './gallery.service.js';
import { resolveMediaMap } from './media.service.js';
import { newsService } from './news.service.js';
import { announcementService, centerService, facultyService, programService, researchService } from './resources.js';
import { listRevisions, saveRevision } from './revision.service.js';

const HOMEPAGE_KEY = 'main';
const SECTION_TYPES = Object.keys(HOMEPAGE_SECTION_SCHEMAS) as [HomepageSectionTypeKey, ...HomepageSectionTypeKey[]];

export const sectionUpdateInput = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  variant: z.string().max(40).optional(),
  enabled: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
export const sectionCreateInput = z.object({ type: z.enum(SECTION_TYPES), label: z.string().trim().max(80).optional() });
export const reorderInput = z.object({ ids: z.array(z.string().uuid()).min(1) });

export function validateSectionData(type: HomepageSectionTypeKey, data: unknown) {
  return HOMEPAGE_SECTION_SCHEMAS[type].parse(data ?? {}) as Record<string, unknown>;
}

interface RenderSection {
  id: string;
  type: HomepageSectionType;
  variant: string;
  data: Record<string, unknown>;
}

/** Loads the live data each dynamic section displays (news, events, programs…). */
async function resolveSections(sections: RenderSection[]) {
  const media = await resolveMediaMap(sections.flatMap((s) => collectMediaIds(s.data)));
  const dynamic: Record<string, unknown> = {};
  await Promise.all(
    sections.map(async (s) => {
      const d = s.data;
      switch (s.type) {
        case 'ANNOUNCEMENT':
          dynamic[s.id] = await announcementService.allPublic({}, Number(d.limit ?? 1));
          break;
        case 'ACADEMICS': {
          const [faculties, programs] = await Promise.all([facultyService.allPublic(), programService.allPublic()]);
          dynamic[s.id] = { faculties, programCount: programs.length, offeredCount: (programs as { isOffered: boolean }[]).filter((p) => p.isOffered).length };
          break;
        }
        case 'RESEARCH':
          dynamic[s.id] = await researchService.allPublic({ type: 'AREA' }, Number(d.areasLimit ?? 8) || undefined);
          break;
        case 'CENTERS':
          dynamic[s.id] = await centerService.allPublic();
          break;
        case 'NEWS':
          dynamic[s.id] = await newsService.latestPublic(Number(d.limit ?? 4));
          break;
        case 'EVENTS':
          dynamic[s.id] = await eventsService.upcomingPublic(Number(d.limit ?? 3));
          break;
        case 'GALLERY':
          dynamic[s.id] = await galleryService.featuredItems((d.galleryId as string | null) ?? null, Number(d.limit ?? 8));
          break;
        default:
          break;
      }
    }),
  );
  return sections.map((s) => ({ ...s, dynamic: dynamic[s.id] ?? null })).map((s) => ({ ...s, media: pickMedia(s.data, media) }));
}

function pickMedia(data: Record<string, unknown>, media: Map<string, unknown>) {
  return Object.fromEntries(collectMediaIds(data).map((id) => [id, media.get(id) ?? null]));
}

async function homepage() {
  return prisma.homepage.upsert({ where: { key: HOMEPAGE_KEY }, update: {}, create: { key: HOMEPAGE_KEY } });
}

function adminSection(s: HomepageSection) {
  return {
    id: s.id,
    type: s.type,
    label: s.label,
    variant: s.draftVariant,
    variants: HOMEPAGE_VARIANTS[s.type as HomepageSectionTypeKey],
    enabled: s.draftEnabled,
    order: s.draftOrder,
    data: s.draftData,
    removed: s.draftRemoved,
    isPublished: s.publishedData !== null,
    publishedEnabled: s.publishedEnabled,
    hasDraftChanges: s.hasDraftChanges,
    updatedAt: s.updatedAt,
  };
}

export const homepageService = {
  async getPublished() {
    const home = await homepage();
    const rows = await prisma.homepageSection.findMany({
      where: { homepageId: home.id, publishedEnabled: true, publishedOrder: { not: null } },
      orderBy: { publishedOrder: 'asc' },
    });
    const sections = rows
      .filter((r) => r.publishedData !== null)
      .map((r) => ({ id: r.id, type: r.type, variant: r.publishedVariant ?? 'default', data: r.publishedData as Record<string, unknown> }));
    return { publishedAt: home.publishedAt, sections: await resolveSections(sections) };
  },

  /** Draft rendering for the preview screen; never exposed publicly. */
  async getPreview() {
    const home = await homepage();
    const rows = await prisma.homepageSection.findMany({ where: { homepageId: home.id, draftEnabled: true, draftRemoved: false }, orderBy: { draftOrder: 'asc' } });
    const sections = rows.map((r) => ({ id: r.id, type: r.type, variant: r.draftVariant, data: r.draftData as Record<string, unknown> }));
    return { preview: true, sections: await resolveSections(sections) };
  },

  async getBuilder() {
    const { id } = await homepage();
    const home = await prisma.homepage.findUniqueOrThrow({ where: { id }, include: { publishedBy: { select: { name: true } } } });
    const sections = await prisma.homepageSection.findMany({ where: { homepageId: home.id }, orderBy: { draftOrder: 'asc' } });
    return {
      id: home.id,
      publishedAt: home.publishedAt,
      publishedBy: home.publishedBy?.name ?? null,
      hasUnpublishedChanges: sections.some((s) => s.hasDraftChanges || s.draftRemoved),
      sections: sections.map(adminSection),
      sectionTypes: SECTION_TYPES.map((type) => ({ type, variants: HOMEPAGE_VARIANTS[type] })),
      revisions: await listRevisions('HOMEPAGE', home.id),
    };
  },

  async getSection(id: string) {
    const section = await prisma.homepageSection.findUnique({ where: { id } });
    if (!section) throw notFound('Section');
    const media = await resolveMediaMap(collectMediaIds(section.draftData as Record<string, unknown>));
    return { ...adminSection(section), media: Object.fromEntries(media) };
  },

  async updateSection(req: Request, id: string, input: z.infer<typeof sectionUpdateInput>) {
    const section = await prisma.homepageSection.findUnique({ where: { id } });
    if (!section) throw notFound('Section');
    const type = section.type as HomepageSectionTypeKey;
    if (input.variant && !HOMEPAGE_VARIANTS[type].includes(input.variant)) throw badRequest('Unknown layout variant for this section');
    const updated = await prisma.homepageSection.update({
      where: { id },
      data: {
        label: input.label,
        draftVariant: input.variant,
        draftEnabled: input.enabled,
        draftData: input.data ? (validateSectionData(type, input.data) as Prisma.InputJsonValue) : undefined,
        hasDraftChanges: true,
        updatedById: req.user?.id,
      },
    });
    await logActivity(req, { action: 'SAVE_DRAFT', entityType: 'homepage', entityId: id, summary: `Edited homepage section "${updated.label}" (draft)` });
    return this.getSection(id);
  },

  async addSection(req: Request, input: z.infer<typeof sectionCreateInput>) {
    const home = await homepage();
    const max = await prisma.homepageSection.aggregate({ where: { homepageId: home.id }, _max: { draftOrder: true } });
    const section = await prisma.homepageSection.create({
      data: {
        homepageId: home.id,
        type: input.type,
        label: input.label || input.type.charAt(0) + input.type.slice(1).toLowerCase(),
        draftData: validateSectionData(input.type, {}) as Prisma.InputJsonValue,
        draftOrder: (max._max.draftOrder ?? -1) + 1,
        updatedById: req.user?.id,
      },
    });
    await logActivity(req, { action: 'CREATE', entityType: 'homepage', entityId: section.id, summary: `Added homepage section "${section.label}" (draft)` });
    return this.getSection(section.id);
  },

  /** Never-published sections are deleted; published ones are marked and removed on the next publish. */
  async removeSection(req: Request, id: string) {
    const section = await prisma.homepageSection.findUnique({ where: { id } });
    if (!section) throw notFound('Section');
    if (section.publishedData === null) await prisma.homepageSection.delete({ where: { id } });
    else await prisma.homepageSection.update({ where: { id }, data: { draftRemoved: true, hasDraftChanges: true } });
    await logActivity(req, { action: 'DELETE', entityType: 'homepage', entityId: id, summary: `Removed homepage section "${section.label}" (draft)` });
  },

  async restoreSection(req: Request, id: string) {
    await prisma.homepageSection.update({ where: { id }, data: { draftRemoved: false, hasDraftChanges: true } });
    await logActivity(req, { action: 'UPDATE', entityType: 'homepage', entityId: id, summary: 'Restored a removed homepage section (draft)' });
  },

  async reorder(req: Request, ids: string[]) {
    const home = await homepage();
    await prisma.$transaction(
      ids.map((id, index) => prisma.homepageSection.update({ where: { id, homepageId: home.id }, data: { draftOrder: index, hasDraftChanges: true } })),
    );
    await logActivity(req, { action: 'REORDER', entityType: 'homepage', summary: 'Reordered homepage sections (draft)' });
  },

  async publish(req: Request) {
    const home = await homepage();
    await prisma.$transaction(async (tx) => {
      const sections = await tx.homepageSection.findMany({ where: { homepageId: home.id }, orderBy: { draftOrder: 'asc' } });
      const snapshot = sections
        .filter((s) => !s.draftRemoved)
        .map((s) => ({ type: s.type, label: s.label, variant: s.draftVariant, enabled: s.draftEnabled, data: s.draftData }));
      let order = 0;
      for (const s of sections) {
        if (s.draftRemoved) {
          await tx.homepageSection.delete({ where: { id: s.id } });
          continue;
        }
        await tx.homepageSection.update({
          where: { id: s.id },
          data: {
            publishedData: s.draftData as Prisma.InputJsonValue,
            publishedVariant: s.draftVariant,
            publishedEnabled: s.draftEnabled,
            publishedOrder: order,
            draftOrder: order++,
            hasDraftChanges: false,
          },
        });
      }
      await tx.homepage.update({ where: { id: home.id }, data: { publishedAt: new Date(), publishedById: req.user?.id } });
      await saveRevision('HOMEPAGE', home.id, snapshot as Prisma.InputJsonValue, req.user?.id, 'Published homepage', tx);
    });
    await logActivity(req, { action: 'PUBLISH', entityType: 'homepage', entityId: home.id, summary: 'Published the homepage' });
    return this.getBuilder();
  },

  /** Resets every section's draft to its published state and drops never-published sections. */
  async discardDraft(req: Request) {
    const home = await homepage();
    await prisma.$transaction(async (tx) => {
      const sections = await tx.homepageSection.findMany({ where: { homepageId: home.id } });
      for (const s of sections) {
        if (s.publishedData === null) {
          await tx.homepageSection.delete({ where: { id: s.id } });
          continue;
        }
        await tx.homepageSection.update({
          where: { id: s.id },
          data: {
            draftData: s.publishedData as Prisma.InputJsonValue,
            draftVariant: s.publishedVariant ?? 'default',
            draftEnabled: s.publishedEnabled,
            draftOrder: s.publishedOrder ?? 0,
            draftRemoved: false,
            hasDraftChanges: false,
          },
        });
      }
    });
    await logActivity(req, { action: 'DISCARD_DRAFT', entityType: 'homepage', entityId: home.id, summary: 'Discarded unpublished homepage changes' });
    return this.getBuilder();
  },

  /** Loads a published revision into the draft for review before republishing. */
  async restoreRevision(req: Request, revisionId: string) {
    const home = await homepage();
    const revision = await prisma.contentRevision.findFirst({ where: { id: revisionId, entityType: 'HOMEPAGE', entityId: home.id } });
    if (!revision) throw notFound('Revision');
    const snapshot = revision.snapshot as { type: HomepageSectionTypeKey; label: string; variant: string; enabled: boolean; data: unknown }[];
    await prisma.$transaction(async (tx) => {
      const existing = await tx.homepageSection.findMany({ where: { homepageId: home.id } });
      for (const s of existing) {
        if (s.publishedData === null) await tx.homepageSection.delete({ where: { id: s.id } });
        else await tx.homepageSection.update({ where: { id: s.id }, data: { draftRemoved: true, hasDraftChanges: true } });
      }
      for (const [index, s] of snapshot.entries()) {
        await tx.homepageSection.create({
          data: {
            homepageId: home.id, type: s.type, label: s.label, draftVariant: s.variant, draftEnabled: s.enabled,
            draftData: validateSectionData(s.type, s.data) as Prisma.InputJsonValue, draftOrder: index, updatedById: req.user?.id,
          },
        });
      }
    });
    await logActivity(req, { action: 'RESTORE', entityType: 'homepage', entityId: home.id, summary: `Loaded homepage version ${revision.version} into the draft` });
    return this.getBuilder();
  },
};
