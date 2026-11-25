import type { Request } from 'express';
import { prisma, type Db, type Prisma, type RevisionEntity } from '../lib/prisma.js';
import type { PermissionKey } from '../config/permissions.js';
import { forbidden } from '../utils/http.js';
import type { StatusValue } from '../utils/publication.js';

const KEEP_REVISIONS = 30;

export async function saveRevision(
  entityType: RevisionEntity,
  entityId: string,
  snapshot: Prisma.InputJsonValue,
  createdById: string | null | undefined,
  note: string,
  db: Db = prisma,
) {
  const last = await db.contentRevision.findFirst({ where: { entityType, entityId }, orderBy: { version: 'desc' }, select: { version: true } });
  const version = (last?.version ?? 0) + 1;
  await db.contentRevision.create({ data: { entityType, entityId, version, snapshot, note, createdById: createdById ?? null } });
  const stale = await db.contentRevision.findMany({
    where: { entityType, entityId },
    orderBy: { version: 'desc' },
    skip: KEEP_REVISIONS,
    select: { id: true },
  });
  if (stale.length) await db.contentRevision.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  return version;
}

export function listRevisions(entityType: RevisionEntity, entityId: string) {
  return prisma.contentRevision.findMany({
    where: { entityType, entityId },
    orderBy: { version: 'desc' },
    select: { id: true, version: true, note: true, createdAt: true, createdBy: { select: { name: true } } },
  });
}

const LIVE: StatusValue[] = ['PUBLISHED', 'SCHEDULED'];

/**
 * Publishing rules: changing status to or from a live state, or editing content that is already live,
 * requires the module's publish permission.
 */
export function assertPublishRights(req: Request, permission: PermissionKey, current: StatusValue | null, next: StatusValue | undefined) {
  if (req.user?.permissions.has(permission)) return;
  const touchesLive = (next && LIVE.includes(next)) || (current && LIVE.includes(current));
  if (touchesLive) throw forbidden('You can save drafts, but publishing or changing live content requires publish permission');
}
