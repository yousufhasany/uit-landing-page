import request from 'supertest';
import { expect } from 'vitest';
import { createApp } from '../src/app.js';
import { DEFAULT_ROLES, PERMISSIONS, SUPER_ADMIN_ROLE } from '../src/config/permissions.js';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/services/auth.service.js';

export const app = createApp();
export const ORIGIN = 'http://localhost:5173';
export const PASSWORD = 'Test-Passw0rd!';

/** Empties every table in the test database and recreates permissions and the built-in roles. */
export async function resetDatabase() {
  const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  if (!db.endsWith('_test')) throw new Error(`Refusing to reset "${db}": not a test database`);
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);

  for (const [key, meta] of Object.entries(PERMISSIONS)) await prisma.permission.create({ data: { key, ...meta } });
  const ids = new Map((await prisma.permission.findMany()).map((p) => [p.key, p.id]));
  for (const [key, role] of Object.entries(DEFAULT_ROLES)) {
    await prisma.role.create({
      data: { key, name: role.name, description: role.description, isSystem: true, permissions: { create: role.permissions.map((p) => ({ permissionId: ids.get(p)! })) } },
    });
  }
}

let counter = 0;
export async function createUser(roleKey: keyof typeof DEFAULT_ROLES | string = SUPER_ADMIN_ROLE, overrides: { email?: string; isActive?: boolean } = {}) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const email = overrides.email ?? `${roleKey.replace(/_/g, '-')}-${++counter}@test.local`;
  return prisma.user.create({
    data: { email, name: `${role.name} ${counter}`, passwordHash: await hashPassword(PASSWORD), isActive: overrides.isActive ?? true, roles: { create: [{ roleId: role.id }] } },
  });
}

/** A cookie-keeping client signed in as the given user. */
export async function loginAs(email: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ email, password: PASSWORD });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return agent;
}

/** A cookie-keeping client signed in as a new user with the given role. */
export async function signedIn(roleKey: string = SUPER_ADMIN_ROLE) {
  const user = await createUser(roleKey);
  return { agent: await loginAs(user.email), user };
}

/** Creates a custom (non-system) role holding exactly the given permissions. */
export function createRole(key: string, permissions: string[]) {
  return prisma.role.create({ data: { key, name: key, permissions: { create: permissions.map((p) => ({ permission: { connect: { key: p } } })) } } });
}

export const anon = () => request(app);
