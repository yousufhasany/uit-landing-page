import type { NextFunction, Request, Response } from 'express';
import type { PermissionKey } from '../config/permissions.js';
import { loadAuthUser } from '../services/auth.service.js';
import { forbidden, unauthorized } from '../utils/http.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens.js';

/** Attaches req.user when a valid access token is present. Never rejects on its own. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = req.cookies?.[ACCESS_COOKIE] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (token) {
    const userId = verifyAccessToken(token);
    if (userId) req.user = (await loadAuthUser(userId)) ?? undefined;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw unauthorized();
  next();
}

/** Requires every listed permission. */
export const requirePermission =
  (...permissions: PermissionKey[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!permissions.every((p) => req.user!.permissions.has(p))) throw forbidden();
    next();
  };

/** Requires at least one of the listed permissions. */
export const requireAnyPermission =
  (...permissions: PermissionKey[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!permissions.some((p) => req.user!.permissions.has(p))) throw forbidden();
    next();
  };

export function hasPermission(req: Request, permission: PermissionKey) {
  return Boolean(req.user?.permissions.has(permission));
}

export function assertPermission(req: Request, permission: PermissionKey, message?: string) {
  if (!hasPermission(req, permission)) throw forbidden(message);
}
