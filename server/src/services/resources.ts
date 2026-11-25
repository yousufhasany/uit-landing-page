import { z } from 'zod';
import { toMediaDTO } from '../utils/media-dto.js';
import { publiclyVisible, publishedOnly } from '../utils/publication.js';
import { sanitizeRichText } from '../utils/sanitize.js';
import { safeUrl } from '../validators/content-blocks.js';
import { statusEnum } from '../validators/news-events.validators.js';
import { createResourceService } from './resource.factory.js';

const slug = z
  .string()
  .trim()
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
  .optional()
  .or(z.literal('').transform(() => undefined))
  .or(z.null().transform(() => undefined));
const uuidOrNull = z.string().uuid().nullable().optional();
const longText = z.string().max(60_000).nullable().optional();
const order = z.coerce.number().int().min(0).default(0);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

const withImage = (r: Rec) => ({ ...r, image: toMediaDTO(r.image) });

// ─────────────── Academics ───────────────

export const facultyService = createResourceService({
  entity: 'faculty',
  model: 'faculty',
  input: z.object({
    name: z.string().trim().min(3).max(160),
    shortName: z.string().trim().max(20).nullable().optional(),
    slug,
    description: longText,
    imageId: uuidOrNull,
    displayOrder: order,
    status: statusEnum.default('DRAFT'),
    needsVerification: z.boolean().default(false),
    verificationNote: z.string().max(500).nullable().optional(),
  }),
  slugSource: 'name',
  include: {
    image: true,
    departments: { orderBy: { displayOrder: 'asc' }, select: { id: true, name: true, slug: true, status: true } },
    _count: { select: { programs: true, departments: true } },
  },
  orderBy: { displayOrder: 'asc' },
  searchFields: ['name', 'shortName'],
  filters: (q) => (q.status ? { status: q.status } : {}),
  publicWhere: () => publishedOnly,
  label: (r) => r.name as string,
  serializeAdmin: withImage,
  serializePublic: (r: Rec) => ({
    id: r.id,
    name: r.name,
    shortName: r.shortName,
    slug: r.slug,
    description: r.description,
    image: toMediaDTO(r.image),
    departments: (r.departments as Rec[]).filter((d) => d.status === 'PUBLISHED').map(({ id, name, slug }) => ({ id, name, slug })),
    programCount: r._count.programs,
  }),
});

export const departmentService = createResourceService({
  entity: 'department',
  model: 'department',
  input: z.object({
    name: z.string().trim().min(3).max(160),
    facultyId: z.string().uuid({ error: 'Select a faculty' }),
    slug,
    description: longText,
    displayOrder: order,
    status: statusEnum.default('DRAFT'),
  }),
  slugSource: 'name',
  include: { faculty: { select: { id: true, name: true, shortName: true } }, _count: { select: { programs: true } } },
  orderBy: [{ faculty: { displayOrder: 'asc' } }, { displayOrder: 'asc' }] as never,
  searchFields: ['name'],
  filters: (q) => ({ ...(q.facultyId ? { facultyId: q.facultyId } : {}), ...(q.status ? { status: q.status } : {}) }),
  publicWhere: () => ({ ...publishedOnly, faculty: publishedOnly }),
  label: (r) => r.name as string,
});

export const PROGRAM_STATUS_LABELS = {
  PROPOSED: 'Proposed',
  UNDER_DEVELOPMENT: 'Under development',
  APPROVED: 'Approved',
  ACTIVE: 'Currently offered',
  ARCHIVED: 'Archived',
} as const;

export const programService = createResourceService({
  entity: 'program',
  model: 'academicProgram',
  input: z.object({
    name: z.string().trim().min(3).max(200),
    slug,
    facultyId: z.string().uuid({ error: 'Select a faculty' }),
    departmentId: uuidOrNull,
    degreeType: z.string().trim().min(1).max(40),
    level: z.enum(['UNDERGRADUATE', 'POSTGRADUATE', 'POSTGRADUATE_DIPLOMA', 'DIPLOMA', 'CERTIFICATE', 'DOCTORAL']),
    description: z.string().max(1000).nullable().optional(),
    overview: longText,
    duration: z.string().trim().max(60).nullable().optional(),
    credits: z.coerce.number().int().min(0).max(400).nullable().optional(),
    curriculum: longText,
    admissionInfo: longText,
    featuredImageId: uuidOrNull,
    programStatus: z.enum(['PROPOSED', 'UNDER_DEVELOPMENT', 'APPROVED', 'ACTIVE', 'ARCHIVED']).default('PROPOSED'),
    launchPhase: z.enum(['PHASE_I', 'PHASE_II', 'PHASE_III']).nullable().optional(),
    isVisible: z.boolean().default(true),
    displayOrder: order,
    seoTitle: z.string().max(70).nullable().optional(),
    seoDescription: z.string().max(170).nullable().optional(),
    needsVerification: z.boolean().default(false),
  }),
  slugSource: 'name',
  include: {
    faculty: { select: { id: true, name: true, shortName: true, slug: true } },
    department: { select: { id: true, name: true, slug: true } },
    featuredImage: true,
  },
  orderBy: [{ faculty: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }] as never,
  searchFields: ['name', 'degreeType'],
  filters: (q) => ({
    ...(q.facultyId ? { facultyId: q.facultyId } : {}),
    ...(q.faculty ? { faculty: { slug: q.faculty } } : {}),
    ...(q.departmentId ? { departmentId: q.departmentId } : {}),
    ...(q.programStatus ? { programStatus: q.programStatus } : {}),
    ...(q.level ? { level: q.level } : {}),
    ...(q.launchPhase ? { launchPhase: q.launchPhase } : {}),
  }),
  publicWhere: () => ({ isVisible: true, programStatus: { not: 'ARCHIVED' }, faculty: publishedOnly }),
  label: (r) => r.name as string,
  prepare: (d) => ({
    ...d,
    overview: d.overview ? sanitizeRichText(d.overview) : d.overview,
    curriculum: d.curriculum ? sanitizeRichText(d.curriculum) : d.curriculum,
    admissionInfo: d.admissionInfo ? sanitizeRichText(d.admissionInfo) : d.admissionInfo,
  }),
  serializeAdmin: (r: Rec) => ({ ...r, featuredImage: toMediaDTO(r.featuredImage) }),
  serializePublic: (r: Rec) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    degreeType: r.degreeType,
    level: r.level,
    description: r.description,
    overview: r.overview,
    duration: r.duration,
    credits: r.credits,
    curriculum: r.curriculum,
    // Admission details are only exposed once a program is actually offered.
    admissionInfo: r.programStatus === 'ACTIVE' ? r.admissionInfo : null,
    programStatus: r.programStatus,
    statusLabel: PROGRAM_STATUS_LABELS[r.programStatus as keyof typeof PROGRAM_STATUS_LABELS],
    isOffered: r.programStatus === 'ACTIVE',
    launchPhase: r.launchPhase,
    faculty: r.faculty,
    department: r.department,
    image: toMediaDTO(r.featuredImage),
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
  }),
});

// ─────────────── Centers & research ───────────────

const centerSection = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().max(4000).optional().default(''),
  items: z.array(z.string().trim().min(1).max(400)).max(60).optional().default([]),
});

export const centerService = createResourceService({
  entity: 'center',
  model: 'center',
  input: z.object({
    name: z.string().trim().min(3).max(200),
    acronym: z.string().trim().max(20).nullable().optional(),
    slug,
    tagline: z.string().trim().max(300).nullable().optional(),
    overview: z.string().trim().min(1, 'Overview is required').max(4000),
    objectives: z.array(z.string().trim().min(1).max(600)).max(20).default([]),
    description: longText,
    sections: z.array(centerSection).max(20).default([]),
    imageId: uuidOrNull,
    ctaLabel: z.string().trim().max(60).nullable().optional(),
    ctaUrl: safeUrl.nullable().optional(),
    displayOrder: order,
    status: statusEnum.default('DRAFT'),
    seoTitle: z.string().max(70).nullable().optional(),
    seoDescription: z.string().max(170).nullable().optional(),
    needsVerification: z.boolean().default(false),
    verificationNote: z.string().max(500).nullable().optional(),
  }),
  slugSource: 'name',
  include: { image: true },
  orderBy: { displayOrder: 'asc' },
  searchFields: ['name', 'acronym'],
  filters: (q) => (q.status ? { status: q.status } : {}),
  publicWhere: () => publishedOnly,
  label: (r) => r.name as string,
  prepare: (d) => ({ ...d, description: d.description ? sanitizeRichText(d.description) : d.description }),
  serializeAdmin: withImage,
  serializePublic: (r: Rec) => {
    const { status, needsVerification, verificationNote, imageId, createdAt, ...rest } = r;
    return { ...rest, image: toMediaDTO(r.image) };
  },
});

export const researchService = createResourceService({
  entity: 'research item',
  model: 'researchItem',
  input: z.object({
    title: z.string().trim().min(3).max(200),
    slug,
    type: z.enum(['AREA', 'INITIATIVE', 'PROJECT', 'PUBLICATION', 'OPPORTUNITY', 'COLLABORATION']),
    summary: z.string().trim().min(1).max(1000),
    description: longText,
    phase: z.enum(['PHASE_I', 'PHASE_II', 'PHASE_III']).nullable().optional(),
    imageId: uuidOrNull,
    centerId: uuidOrNull,
    externalUrl: safeUrl.nullable().optional(),
    displayOrder: order,
    status: statusEnum.default('DRAFT'),
    publishedAt: z.coerce.date().nullable().optional(),
  }),
  slugSource: 'title',
  include: { image: true, center: { select: { id: true, name: true, acronym: true, slug: true } } },
  orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }] as never,
  searchFields: ['title', 'summary'],
  filters: (q) => ({ ...(q.type ? { type: q.type } : {}), ...(q.status ? { status: q.status } : {}), ...(q.phase ? { phase: q.phase } : {}) }),
  publicWhere: () => publiclyVisible(),
  label: (r) => r.title as string,
  prepare: (d) => ({
    ...d,
    description: d.description ? sanitizeRichText(d.description) : d.description,
    publishedAt: d.publishedAt ?? (d.status === 'PUBLISHED' ? new Date() : null),
  }),
  serializeAdmin: withImage,
  serializePublic: (r: Rec) => ({
    id: r.id, title: r.title, slug: r.slug, type: r.type, summary: r.summary, description: r.description,
    phase: r.phase, externalUrl: r.externalUrl, center: r.center, image: toMediaDTO(r.image),
  }),
});

// ─────────────── Campus ───────────────

export const DEVELOPMENT_STATUS_LABELS = {
  CURRENT: 'Operational',
  IN_PROGRESS: 'In progress',
  PROPOSED: 'Proposed',
  CONCEPT: 'Concept',
} as const;

export const campusService = createResourceService({
  entity: 'campus item',
  model: 'campusItem',
  input: z.object({
    title: z.string().trim().min(2).max(200),
    slug,
    description: z.string().trim().min(1).max(4000),
    imageId: uuidOrNull,
    category: z.enum(['TEMPORARY_CAMPUS', 'FACILITY', 'ACTIVITY', 'PERMANENT_CAMPUS', 'CAMPUS_DEVELOPMENT', 'KNOWLEDGE_CITY', 'LOCATION']),
    developmentStatus: z.enum(['CURRENT', 'IN_PROGRESS', 'PROPOSED', 'CONCEPT']),
    displayOrder: order,
    status: statusEnum.default('DRAFT'),
    needsVerification: z.boolean().default(false),
  }),
  slugSource: 'title',
  include: { image: true },
  orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }] as never,
  searchFields: ['title', 'description'],
  filters: (q) => ({
    ...(q.category ? { category: { in: q.category.split(',') } } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.developmentStatus ? { developmentStatus: q.developmentStatus } : {}),
  }),
  publicWhere: () => publishedOnly,
  label: (r) => r.title as string,
  serializeAdmin: withImage,
  serializePublic: (r: Rec) => ({
    id: r.id, title: r.title, slug: r.slug, description: r.description, category: r.category,
    developmentStatus: r.developmentStatus,
    statusLabel: DEVELOPMENT_STATUS_LABELS[r.developmentStatus as keyof typeof DEVELOPMENT_STATUS_LABELS],
    image: toMediaDTO(r.image),
  }),
});

// ─────────────── Announcements & site ───────────────

export const announcementService = createResourceService({
  entity: 'announcement',
  model: 'announcement',
  input: z
    .object({
      title: z.string().trim().min(2).max(160),
      message: z.string().trim().min(2).max(400),
      url: safeUrl.nullable().optional(),
      linkLabel: z.string().trim().max(40).nullable().optional(),
      type: z.enum(['ADMISSION', 'IMPORTANT', 'GENERAL', 'EVENT', 'NOTICE']).default('GENERAL'),
      style: z.enum(['INFO', 'HIGHLIGHT', 'URGENT']).default('INFO'),
      startsAt: z.coerce.date().nullable().optional(),
      endsAt: z.coerce.date().nullable().optional(),
      priority: z.coerce.number().int().min(0).max(100).default(0),
      isVisible: z.boolean().default(true),
      autoHideExpired: z.boolean().default(true),
      status: statusEnum.default('DRAFT'),
    })
    .refine((a) => !a.startsAt || !a.endsAt || a.endsAt > a.startsAt, { message: 'End must be after the start', path: ['endsAt'] }),
  orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }] as never,
  searchFields: ['title', 'message'],
  filters: (q) => ({ ...(q.status ? { status: q.status } : {}), ...(q.type ? { type: q.type } : {}) }),
  publicWhere: () => {
    const now = new Date();
    return {
      status: 'PUBLISHED',
      isVisible: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }, { autoHideExpired: false }] },
      ],
    };
  },
  label: (r) => r.title as string,
  serializePublic: (r: Rec) => ({ id: r.id, title: r.title, message: r.message, url: r.url, linkLabel: r.linkLabel, type: r.type, style: r.style }),
});

export const socialLinkService = createResourceService({
  entity: 'social link',
  model: 'socialLink',
  input: z.object({
    platform: z.enum(['facebook', 'x', 'linkedin', 'youtube', 'instagram', 'website', 'other']),
    label: z.string().trim().min(1).max(60),
    url: z.string().trim().url('Enter a full URL starting with https://').max(400).refine((v) => /^https?:\/\//.test(v), 'Use an http(s) link'),
    displayOrder: order,
    isVisible: z.boolean().default(true),
  }),
  orderBy: { displayOrder: 'asc' },
  searchFields: ['label', 'url'],
  publicWhere: () => ({ isVisible: true }),
  label: (r) => r.label as string,
  serializePublic: (r: Rec) => ({ id: r.id, platform: r.platform, label: r.label, url: r.url }),
});

export const contactService = createResourceService({
  entity: 'contact detail',
  model: 'contactInformation',
  input: z.object({
    label: z.string().trim().min(1).max(120),
    type: z.enum(['ADDRESS', 'PHONE', 'EMAIL', 'WEBSITE', 'HOURS']),
    value: z.string().trim().min(1).max(500),
    description: z.string().trim().max(300).nullable().optional(),
    displayOrder: order,
    isVisible: z.boolean().default(true),
    needsVerification: z.boolean().default(false),
  }),
  orderBy: { displayOrder: 'asc' },
  searchFields: ['label', 'value'],
  publicWhere: () => ({ isVisible: true }),
  label: (r) => r.label as string,
  serializePublic: (r: Rec) => ({ id: r.id, label: r.label, type: r.type, value: r.value, description: r.description }),
});
