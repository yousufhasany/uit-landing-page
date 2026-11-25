import type { Request } from 'express';
import { z, type ZodType } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../utils/http.js';
import { paged, paginate, paginationQuery } from '../utils/pagination.js';
import { uniqueSlug } from '../utils/slug.js';
import { logActivity } from './activity.service.js';

/* Prisma model delegates share a call shape but not a common TypeScript type, so the factory treats them structurally. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = any;
type Where = Record<string, unknown>;

export interface ResourceConfig<Input extends Record<string, unknown>> {
  /** Singular entity name used in activity logs and errors, e.g. "faculty". */
  entity: string;
  model: keyof typeof prisma;
  input: ZodType<Input>;
  /** Field the slug is generated from when none is supplied. */
  slugSource?: keyof Input & string;
  include?: Record<string, unknown>;
  orderBy: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];
  searchFields: string[];
  /** Extra admin/public filters built from the query string. */
  filters?: (query: Record<string, string | undefined>) => Where;
  publicWhere?: () => Where;
  label: (record: Record<string, unknown>) => string;
  prepare?: (data: Input) => Record<string, unknown>;
  serializeAdmin?: (record: Record<string, unknown>) => unknown;
  serializePublic?: (record: Record<string, unknown>) => unknown;
}

export const listQuery = paginationQuery.extend({ pageSize: z.coerce.number().int().min(1).max(200).default(50) }).passthrough();

export function createResourceService<Input extends Record<string, unknown>>(config: ResourceConfig<Input>) {
  const delegate = () => (prisma as Delegate)[config.model] as Delegate;
  const admin = (r: Record<string, unknown>) => (config.serializeAdmin ? config.serializeAdmin(r) : r);
  const pub = (r: Record<string, unknown>) => (config.serializePublic ? config.serializePublic(r) : r);
  const hasSlug = Boolean(config.slugSource);

  function where(query: Record<string, string | undefined>, publicOnly: boolean): Where {
    const and: Where[] = [];
    if (publicOnly && config.publicWhere) and.push(config.publicWhere());
    if (config.filters) and.push(config.filters(query));
    if (query.q) and.push({ OR: config.searchFields.map((f) => ({ [f]: { contains: query.q, mode: 'insensitive' } })) });
    return { AND: and };
  }

  async function slugFor(data: Record<string, unknown>, excludeId?: string) {
    if (!hasSlug) return undefined;
    const base = (data.slug as string | undefined) || String(data[config.slugSource!]);
    return uniqueSlug(base, async (slug) =>
      Boolean(await delegate().findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } })),
    );
  }

  return {
    config,

    async list(rawQuery: Record<string, unknown>, publicOnly = false) {
      const query = listQuery.parse(rawQuery) as z.infer<typeof listQuery> & Record<string, string | undefined>;
      const w = where(query, publicOnly);
      const [items, total] = await Promise.all([
        delegate().findMany({ where: w, include: config.include, orderBy: config.orderBy, ...paginate(query) }),
        delegate().count({ where: w }),
      ]);
      return paged(items.map(publicOnly ? pub : admin), total, query.page, query.pageSize);
    },

    async allPublic(extraWhere: Where = {}, take?: number) {
      const items = await delegate().findMany({
        where: { AND: [config.publicWhere ? config.publicWhere() : {}, extraWhere] },
        include: config.include,
        orderBy: config.orderBy,
        take,
      });
      return items.map(pub);
    },

    async getPublicBySlug(slug: string) {
      const record = await delegate().findFirst({ where: { AND: [{ slug }, config.publicWhere ? config.publicWhere() : {}] }, include: config.include });
      if (!record) throw notFound(config.entity);
      return pub(record);
    },

    async get(id: string) {
      const record = await delegate().findUnique({ where: { id }, include: config.include });
      if (!record) throw notFound(config.entity);
      return admin(record);
    },

    async create(req: Request, body: unknown) {
      const input = config.input.parse(body);
      const data = config.prepare ? config.prepare(input) : { ...input };
      if (hasSlug) data.slug = await slugFor(data);
      const record = await delegate().create({ data, include: config.include });
      await logActivity(req, { action: 'CREATE', entityType: config.entity, entityId: record.id, summary: `Created ${config.entity} "${config.label(record)}"` });
      return admin(record);
    },

    async update(req: Request, id: string, body: unknown) {
      const existing = await delegate().findUnique({ where: { id } });
      if (!existing) throw notFound(config.entity);
      const input = config.input.parse(body);
      const data = config.prepare ? config.prepare(input) : { ...input };
      if (hasSlug) data.slug = data.slug && data.slug !== existing.slug ? await slugFor(data, id) : existing.slug;
      const record = await delegate().update({ where: { id }, data, include: config.include });
      await logActivity(req, { action: 'UPDATE', entityType: config.entity, entityId: id, summary: `Updated ${config.entity} "${config.label(record)}"` });
      return admin(record);
    },

    async remove(req: Request, id: string) {
      const record = await delegate().delete({ where: { id } });
      await logActivity(req, { action: 'DELETE', entityType: config.entity, entityId: id, summary: `Deleted ${config.entity} "${config.label(record)}"` });
    },

    /** Persists display order from an ordered list of ids in a single transaction. */
    async reorder(req: Request, ids: string[]) {
      await prisma.$transaction(ids.map((id, index) => delegate().update({ where: { id }, data: { displayOrder: index } })));
      await logActivity(req, { action: 'REORDER', entityType: config.entity, summary: `Reordered ${ids.length} ${config.entity} items` });
    },
  };
}

export type ResourceService = Omit<ReturnType<typeof createResourceService>, 'config'>;
