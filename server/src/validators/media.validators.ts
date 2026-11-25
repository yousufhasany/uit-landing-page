import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';

export const mediaListQuery = paginationQuery.extend({
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  category: z.string().max(60).optional(),
  folderId: z.string().uuid().optional(),
  tag: z.string().max(60).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const mediaUpdateSchema = z.object({
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const mediaUploadFields = z.object({
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
  category: z.string().trim().max(60).optional(),
  folderId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
});

export const folderSchema = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: z.string().uuid().nullable().optional(),
});
