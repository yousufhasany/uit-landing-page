import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { safeUrl } from './content-blocks.js';

export const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']);
const optionalDate = z.coerce.date().nullable().optional();
const slugField = z
  .string()
  .trim()
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
  .optional()
  .or(z.literal('').transform(() => undefined))
  .or(z.null().transform(() => undefined));

export const newsInput = z.object({
  title: z.string().trim().min(3).max(200),
  slug: slugField,
  summary: z.string().trim().min(1, 'Summary is required').max(600),
  content: z.string().max(100_000).default(''),
  featuredImageId: z.string().uuid().nullable().optional(),
  imageAlt: z.string().trim().max(300).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  status: statusEnum.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  publishedAt: optionalDate,
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(170).nullable().optional(),
});

export const newsListQuery = paginationQuery.extend({
  status: statusEnum.optional(),
  category: z.string().max(80).optional(),
  featured: z.enum(['true', 'false']).optional(),
  tag: z.string().max(60).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const eventInput = z
  .object({
    title: z.string().trim().min(3).max(200),
    slug: slugField,
    summary: z.string().trim().min(1, 'Summary is required').max(600),
    description: z.string().max(100_000).default(''),
    featuredImageId: z.string().uuid().nullable().optional(),
    imageAlt: z.string().trim().max(300).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    startsAt: z.coerce.date({ error: 'Start date is required' }),
    endsAt: optionalDate,
    isAllDay: z.boolean().default(false),
    venue: z.string().trim().max(200).nullable().optional(),
    registrationUrl: safeUrl.nullable().optional(),
    status: statusEnum.default('DRAFT'),
    isFeatured: z.boolean().default(false),
    publishedAt: optionalDate,
    seoTitle: z.string().trim().max(70).nullable().optional(),
    seoDescription: z.string().trim().max(170).nullable().optional(),
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, { message: 'End must be after the start', path: ['endsAt'] });

export const eventListQuery = paginationQuery.extend({
  status: statusEnum.optional(),
  when: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  category: z.string().max(80).optional(),
  featured: z.enum(['true', 'false']).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const categoryInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).nullable().optional(),
});
