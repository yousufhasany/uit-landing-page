import type { Request } from 'express';
import { z } from 'zod';
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from '../config/permissions.js';
import { prisma } from '../lib/prisma.js';
import { refreshTokenRepository, userRepository } from '../repositories/user.repository.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/http.js';
import { paged, paginate, paginationQuery } from '../utils/pagination.js';
import { slugify } from '../utils/slug.js';
import { logActivity } from './activity.service.js';
import { hashPassword } from './auth.service.js';

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), 'Include upper and lower case letters and a number');

export const userCreateInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  password: passwordSchema,
  roleIds: z.array(z.string().uuid()).min(1, 'Assign at least one role'),
  isActive: z.boolean().default(true),
});
export const userUpdateInput = userCreateInput.omit({ password: true }).partial();
export const passwordResetInput = z.object({ password: passwordSchema });
export const userListQuery = paginationQuery.extend({ roleId: z.string().uuid().optional(), active: z.enum(['true', 'false']).optional() });

export const roleInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).nullable().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).default([]),
});

async function rolesAreSuperAdmin(roleIds: string[]) {
  return Boolean(await prisma.role.findFirst({ where: { id: { in: roleIds }, key: SUPER_ADMIN_ROLE } }));
}

function serializeUser(u: { id: string; name: string; email: string; isActive: boolean; lastLoginAt: Date | null; createdAt: Date; roles: { role: { id: string; key: string; name: string } }[] }) {
  return {
    id: u.id, name: u.name, email: u.email, isActive: u.isActive, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    roles: u.roles.map((r) => ({ id: r.role.id, key: r.role.key, name: r.role.name })),
  };
}

export const usersService = {
  async list(query: z.infer<typeof userListQuery>) {
    const [items, total] = await userRepository.list({
      where: {
        isActive: query.active ? query.active === 'true' : undefined,
        roles: query.roleId ? { some: { roleId: query.roleId } } : undefined,
        OR: query.q ? [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }] : undefined,
      },
      ...paginate(query),
    });
    return paged(items.map(serializeUser), total, query.page, query.pageSize);
  },

  async create(req: Request, input: z.infer<typeof userCreateInput>) {
    if ((await rolesAreSuperAdmin(input.roleIds)) && !req.user?.isSuperAdmin) throw forbidden('Only a Super Admin can create Super Admin accounts');
    if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('A user with this email already exists');
    const user = await prisma.user.create({
      data: {
        name: input.name, email: input.email, isActive: input.isActive, passwordHash: await hashPassword(input.password),
        roles: { create: input.roleIds.map((roleId) => ({ roleId })) },
      },
      include: { roles: { include: { role: true } } },
    });
    await logActivity(req, { action: 'CREATE', entityType: 'user', entityId: user.id, summary: `Created user ${user.email}` });
    return serializeUser(user);
  },

  async update(req: Request, id: string, input: z.infer<typeof userUpdateInput>) {
    const target = await userRepository.findById(id);
    if (!target) throw notFound('User');
    const targetIsSuper = target.roles.some((r) => r.role.key === SUPER_ADMIN_ROLE);
    if (targetIsSuper && !req.user?.isSuperAdmin) throw forbidden('Only a Super Admin can modify a Super Admin account');
    if (input.roleIds && (await rolesAreSuperAdmin(input.roleIds)) && !req.user?.isSuperAdmin) throw forbidden('Only a Super Admin can assign the Super Admin role');
    if (id === req.user?.id && input.isActive === false) throw badRequest('You cannot deactivate your own account');

    const losesSuper = targetIsSuper && ((input.roleIds && !(await rolesAreSuperAdmin(input.roleIds))) || input.isActive === false);
    if (losesSuper && (await userRepository.countActiveWithRole(SUPER_ADMIN_ROLE, id)) === 0) throw badRequest('At least one active Super Admin is required');

    const user = await prisma.$transaction(async (tx) => {
      if (input.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({ data: input.roleIds.map((roleId) => ({ userId: id, roleId })) });
      }
      return tx.user.update({
        where: { id },
        data: { name: input.name, email: input.email, isActive: input.isActive },
        include: { roles: { include: { role: true } } },
      });
    });
    if (input.isActive === false) await refreshTokenRepository.revokeAllForUser(id);
    await logActivity(req, { action: 'UPDATE', entityType: 'user', entityId: id, summary: `Updated user ${user.email}` });
    return serializeUser(user);
  },

  async resetPassword(req: Request, id: string, password: string) {
    const target = await userRepository.findById(id);
    if (!target) throw notFound('User');
    if (target.roles.some((r) => r.role.key === SUPER_ADMIN_ROLE) && !req.user?.isSuperAdmin) throw forbidden('Only a Super Admin can reset a Super Admin password');
    await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
    await refreshTokenRepository.revokeAllForUser(id);
    await logActivity(req, { action: 'RESET_PASSWORD', entityType: 'user', entityId: id, summary: `Reset password for ${target.email}` });
  },

  async remove(req: Request, id: string) {
    if (id === req.user?.id) throw badRequest('You cannot delete your own account');
    const target = await userRepository.findById(id);
    if (!target) throw notFound('User');
    if (target.roles.some((r) => r.role.key === SUPER_ADMIN_ROLE)) {
      if (!req.user?.isSuperAdmin) throw forbidden('Only a Super Admin can delete a Super Admin account');
      if ((await userRepository.countActiveWithRole(SUPER_ADMIN_ROLE, id)) === 0) throw badRequest('At least one active Super Admin is required');
    }
    await prisma.user.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'user', entityId: id, summary: `Deleted user ${target.email}` });
  },
};

export const rolesService = {
  async list() {
    const roles = await prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    });
    return roles.map((r) => ({
      id: r.id, key: r.key, name: r.name, description: r.description, isSystem: r.isSystem, userCount: r._count.users,
      permissions: r.permissions.map((p) => p.permission.key).sort(),
    }));
  },

  permissions: () => prisma.permission.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] }),

  /** A user can only grant permissions they hold themselves. */
  assertCanGrant(req: Request, permissions: string[]) {
    const missing = permissions.filter((p) => !req.user?.permissions.has(p));
    if (missing.length) throw forbidden(`You cannot grant permissions you do not hold: ${missing.join(', ')}`);
  },

  async create(req: Request, input: z.infer<typeof roleInput>) {
    this.assertCanGrant(req, input.permissions);
    const key = slugify(input.name).replace(/[-/]/g, '_');
    if (await prisma.role.findUnique({ where: { key } })) throw conflict('A role with this name already exists');
    const perms = await prisma.permission.findMany({ where: { key: { in: input.permissions } } });
    const role = await prisma.role.create({
      data: { key, name: input.name, description: input.description, permissions: { create: perms.map((p) => ({ permissionId: p.id })) } },
    });
    await logActivity(req, { action: 'CREATE', entityType: 'role', entityId: role.id, summary: `Created role ${role.name}` });
    return role;
  },

  async update(req: Request, id: string, input: z.infer<typeof roleInput>) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw notFound('Role');
    if (role.key === SUPER_ADMIN_ROLE) throw forbidden('The Super Admin role always has every permission and cannot be edited');
    this.assertCanGrant(req, input.permissions);
    const perms = await prisma.permission.findMany({ where: { key: { in: input.permissions } } });
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: id, permissionId: p.id })) }),
      prisma.role.update({ where: { id }, data: { name: input.name, description: input.description } }),
    ]);
    await logActivity(req, { action: 'UPDATE', entityType: 'role', entityId: id, summary: `Updated permissions of role ${input.name}`, metadata: { permissions: input.permissions } });
    return (await this.list()).find((r) => r.id === id);
  },

  async remove(req: Request, id: string) {
    const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw notFound('Role');
    if (role.isSystem) throw forbidden('Built-in roles cannot be deleted');
    if (role._count.users) throw conflict('Reassign the users of this role before deleting it');
    await prisma.role.delete({ where: { id } });
    await logActivity(req, { action: 'DELETE', entityType: 'role', entityId: id, summary: `Deleted role ${role.name}` });
  },
};
