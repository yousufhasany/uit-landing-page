import { z } from 'zod';

const text = (max = 300) => z.string().trim().max(max);
const optionalText = (max = 300) => text(max).optional().default('');
export const mediaRef = z.string().uuid().nullable().optional().default(null);

/** Internal paths ("/about"), anchors, mailto/tel and http(s) URLs only. */
export const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(v), 'Use a path starting with / or a full https:// link');

export const buttonSchema = z.object({
  label: text(60).min(1, 'Button label is required'),
  url: safeUrl.refine((v) => v.length > 0, 'Button link is required'),
  style: z.enum(['primary', 'secondary', 'link']).default('primary'),
});
const buttons = z.array(buttonSchema).max(3).default([]);

const header = {
  eyebrow: optionalText(80),
  title: optionalText(200),
  description: optionalText(1200),
};

const titledText = z.object({ title: text(120).default(''), text: text(800).default('') });

export const HOMEPAGE_SECTION_SCHEMAS = {
  ANNOUNCEMENT: z.object({ limit: z.number().int().min(1).max(5).default(1) }),
  HERO: z.object({
    ...header,
    subtitle: optionalText(300),
    imageId: mediaRef,
    slides: z
      .array(z.object({ imageId: mediaRef, caption: optionalText(200) }))
      .max(8)
      .default([]),
    videoUrl: safeUrl.optional().default(''),
    focalX: z.number().min(0).max(100).default(50),
    focalY: z.number().min(0).max(100).default(50),
    overlay: z.number().min(0).max(90).default(55),
    align: z.enum(['left', 'center']).default('left'),
    caption: optionalText(200),
    buttons,
  }),
  ABOUT: z.object({ ...header, body: optionalText(6000), imageId: mediaRef, highlights: z.array(titledText).max(6).default([]), buttons }),
  VISION: z.object({ ...header, items: z.array(z.object({ text: text(400) })).max(6).default([]) }),
  MISSION: z.object({ ...header, items: z.array(z.object({ text: text(400) })).max(6).default([]) }),
  PHILOSOPHY: z.object({
    ...header,
    pillars: z.array(titledText).max(6).default([]),
    outcomeTitle: optionalText(120),
    outcomeText: optionalText(600),
    buttons,
  }),
  STATISTICS: z.object({
    ...header,
    items: z.array(z.object({ value: text(30), label: text(120), note: optionalText(200) })).max(8).default([]),
    sourceNote: optionalText(300),
  }),
  ACADEMICS: z.object({ ...header, statusNote: optionalText(400), buttons }),
  RESEARCH: z.object({ ...header, imageId: mediaRef, areasLimit: z.number().int().min(0).max(12).default(8), buttons }),
  CENTERS: z.object({ ...header, buttons }),
  NEWS: z.object({ ...header, limit: z.number().int().min(1).max(12).default(4), buttons }),
  EVENTS: z.object({
    ...header,
    limit: z.number().int().min(1).max(12).default(3),
    hideWhenEmpty: z.boolean().default(true),
    emptyMessage: optionalText(300),
    buttons,
  }),
  CAMPUS: z.object({
    ...header,
    currentTitle: optionalText(120),
    currentText: optionalText(1000),
    currentImageId: mediaRef,
    futureTitle: optionalText(120),
    futureText: optionalText(1000),
    futureImageId: mediaRef,
    buttons,
  }),
  GALLERY: z.object({ ...header, galleryId: mediaRef, limit: z.number().int().min(3).max(24).default(8), buttons }),
  PARTNERSHIPS: z.object({
    ...header,
    items: z.array(z.object({ title: text(160), date: optionalText(40), text: optionalText(600), imageId: mediaRef })).max(8).default([]),
    buttons,
  }),
  CTA: z.object({ ...header, imageId: mediaRef, buttons }),
  FOOTER: z.object({ note: optionalText(300) }),
} as const;

export type HomepageSectionTypeKey = keyof typeof HOMEPAGE_SECTION_SCHEMAS;

export const HOMEPAGE_VARIANTS: Record<HomepageSectionTypeKey, string[]> = {
  ANNOUNCEMENT: ['default'],
  HERO: ['default', 'split', 'centered'],
  ABOUT: ['default', 'image-left'],
  VISION: ['default', 'light'],
  MISSION: ['default', 'dark'],
  PHILOSOPHY: ['default'],
  STATISTICS: ['default', 'dark'],
  ACADEMICS: ['default'],
  RESEARCH: ['default', 'dark'],
  CENTERS: ['default'],
  NEWS: ['default', 'list'],
  EVENTS: ['default'],
  CAMPUS: ['default'],
  GALLERY: ['default'],
  PARTNERSHIPS: ['default'],
  CTA: ['default', 'image'],
  FOOTER: ['default'],
};

/** Media-id fields per section, used to resolve images in one query. */
export function collectMediaIds(data: Record<string, unknown>): string[] {
  const ids: string[] = [];
  const visit = (value: unknown, key?: string) => {
    if (typeof value === 'string' && key && /imageId$|^mediaId$|^imageId$/i.test(key)) ids.push(value);
    else if (Array.isArray(value)) value.forEach((v) => visit(v));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, k));
  };
  visit(data);
  return ids;
}

// ─────────────── Page content blocks ───────────────

export const DYNAMIC_MODULES = [
  'programs', 'faculties', 'centers', 'research-areas', 'research-projects', 'publications',
  'news', 'events', 'campus', 'gallery-albums', 'contact', 'timeline-milestones',
] as const;

export const PAGE_BLOCK_SCHEMAS = {
  HEADING: z.object({ eyebrow: optionalText(80), text: text(200).min(1, 'Heading text is required'), level: z.union([z.literal(2), z.literal(3)]).default(2) }),
  RICH_TEXT: z.object({ html: z.string().max(60000).default('') }),
  IMAGE: z.object({ mediaId: mediaRef, caption: optionalText(300), size: z.enum(['inline', 'wide', 'full']).default('wide') }),
  CTA: z.object({ title: optionalText(200), text: optionalText(600), buttons }),
  QUOTE: z.object({ text: text(800), attribution: optionalText(160) }),
  CARD_GRID: z.object({
    title: optionalText(200),
    intro: optionalText(800),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
    variant: z.enum(['standard', 'people']).default('standard'),
    cards: z
      .array(z.object({ title: text(160), text: optionalText(1200), url: safeUrl.optional().default(''), badge: optionalText(40), imageId: mediaRef }))
      .max(24)
      .default([]),
  }),
  TIMELINE: z.object({
    title: optionalText(200),
    items: z.array(z.object({ date: text(60), title: text(200), text: optionalText(1200) })).max(40).default([]),
  }),
  STATS: z.object({
    items: z.array(z.object({ value: text(30), label: text(120), note: optionalText(200) })).max(8).default([]),
    sourceNote: optionalText(300),
  }),
  DYNAMIC: z.object({
    module: z.enum(DYNAMIC_MODULES),
    title: optionalText(200),
    intro: optionalText(800),
    category: optionalText(60),
    limit: z.number().int().min(1).max(100).default(12),
  }),
} as const;

export type PageBlockTypeKey = keyof typeof PAGE_BLOCK_SCHEMAS;

export const pageBlockInput = z
  .object({ id: z.string().optional(), type: z.enum(Object.keys(PAGE_BLOCK_SCHEMAS) as [PageBlockTypeKey, ...PageBlockTypeKey[]]), data: z.record(z.string(), z.unknown()) })
  .transform((block, ctx) => {
    const result = PAGE_BLOCK_SCHEMAS[block.type].safeParse(block.data);
    if (!result.success) {
      for (const issue of result.error.issues) ctx.addIssue({ code: 'custom', message: issue.message, path: ['data', ...issue.path] });
      return z.NEVER;
    }
    return { ...block, data: result.data as Record<string, unknown> };
  });
