import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { SUPER_ADMIN_ROLE } from '../config/permissions.js';
import { prisma } from '../lib/prisma.js';
import { refreshTokenRepository, userRepository, type UserWithRoles } from '../repositories/user.repository.js';
import { badRequest, unauthorized } from '../utils/http.js';
import { createRefreshToken, hashRefreshToken, signAccessToken } from '../utils/tokens.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: Set<string>;
  isSuperAdmin: boolean;
}

const BCRYPT_ROUNDS = 12;
// Equalises response time for unknown emails so accounts cannot be enumerated by timing.
const DUMMY_HASH = bcrypt.hashSync('uit-dummy-password', BCRYPT_ROUNDS);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export function toAuthUser(user: UserWithRoles): AuthUser {
  const roles = user.roles.map((r) => r.role.key);
  const permissions = new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.key)));
  return { id: user.id, email: user.email, name: user.name, roles, permissions, isSuperAdmin: roles.includes(SUPER_ADMIN_ROLE) };
}

export function serializeAuthUser(user: AuthUser) {
  return { id: user.id, email: user.email, name: user.name, roles: user.roles, permissions: [...user.permissions].sort(), isSuperAdmin: user.isSuperAdmin };
}

export async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) return null;
  return toAuthUser(user);
}

async function issueTokens(userId: string, meta: { ip?: string; userAgent?: string }) {
  const { token, hash } = createRefreshToken();
  await refreshTokenRepository.create({
    userId,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
    ip: meta.ip,
    userAgent: meta.userAgent?.slice(0, 255),
  });
  return { accessToken: signAccessToken(userId), refreshToken: token };
}

export const authService = {
  async login(email: string, password: string, meta: { ip?: string; userAgent?: string }) {
    const user = await userRepository.findByEmail(email);
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.isActive) throw unauthorized('Invalid email or password');
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await issueTokens(user.id, meta);
    return { user: toAuthUser(user), ...tokens };
  },

  /** Rotates the refresh token. Re-use of a revoked token revokes every session of that user. */
  async refresh(rawToken: string | undefined, meta: { ip?: string; userAgent?: string }) {
    if (!rawToken) throw unauthorized('Session expired');
    const stored = await refreshTokenRepository.findByHash(hashRefreshToken(rawToken));
    if (!stored) throw unauthorized('Session expired');
    if (stored.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw unauthorized('Session expired');
    }
    if (stored.expiresAt < new Date()) throw unauthorized('Session expired');
    const user = await loadAuthUser(stored.userId);
    if (!user) throw unauthorized('Session expired');
    await refreshTokenRepository.revoke(stored.id);
    const tokens = await issueTokens(user.id, meta);
    return { user, ...tokens };
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const stored = await refreshTokenRepository.findByHash(hashRefreshToken(rawToken));
    if (stored && !stored.revokedAt) await refreshTokenRepository.revoke(stored.id);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw badRequest('Current password is incorrect');
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
    await refreshTokenRepository.revokeAllForUser(userId);
  },
};
