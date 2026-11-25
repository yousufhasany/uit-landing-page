import type { Request } from 'express';
import { prisma, type Db, type Prisma } from '../lib/prisma.js';

export interface ActivityInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(req: Request | null, input: ActivityInput, db: Db = prisma) {
  try {
    await db.activityLog.create({
      data: {
        ...input,
        userId: req?.user?.id ?? null,
        ip: req?.ip ?? null,
        userAgent: req?.headers['user-agent']?.slice(0, 255) ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log', error);
  }
}

export const activityService = {
  async list(query: { page: number; pageSize: number; q?: string; entityType?: string; userId?: string; action?: string }) {
    const where: Prisma.ActivityLogWhereInput = {
      entityType: query.entityType || undefined,
      userId: query.userId || undefined,
      action: query.action || undefined,
      summary: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
  },
};
