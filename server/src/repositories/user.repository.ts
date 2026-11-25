import { prisma, type Db, type Prisma } from '../lib/prisma.js';

export const userWithRoles = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userWithRoles }>;

export const userRepository = {
  findByEmail: (email: string, db: Db = prisma) =>
    db.user.findUnique({ where: { email: email.toLowerCase() }, include: userWithRoles }),

  findById: (id: string, db: Db = prisma) => db.user.findUnique({ where: { id }, include: userWithRoles }),

  list: (args: { where: Prisma.UserWhereInput; skip: number; take: number }, db: Db = prisma) =>
    Promise.all([
      db.user.findMany({ ...args, orderBy: { createdAt: 'asc' }, include: { roles: { include: { role: true } } } }),
      db.user.count({ where: args.where }),
    ]),

  countActiveWithRole: (roleKey: string, excludeUserId?: string, db: Db = prisma) =>
    db.user.count({
      where: { isActive: true, id: excludeUserId ? { not: excludeUserId } : undefined, roles: { some: { role: { key: roleKey } } } },
    }),
};

export const refreshTokenRepository = {
  create: (data: Prisma.RefreshTokenUncheckedCreateInput, db: Db = prisma) => db.refreshToken.create({ data }),
  findByHash: (tokenHash: string, db: Db = prisma) => db.refreshToken.findUnique({ where: { tokenHash } }),
  revoke: (id: string, db: Db = prisma) => db.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),
  revokeAllForUser: (userId: string, db: Db = prisma) =>
    db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  purgeExpired: (db: Db = prisma) => db.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
};
