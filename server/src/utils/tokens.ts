import crypto from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

export const ACCESS_COOKIE = 'uit_at';
export const REFRESH_COOKIE = 'uit_rt';

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId, typ: 'access' }, env.JWT_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    issuer: 'uit-cms',
  });
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'uit-cms' }) as jwt.JwtPayload;
    return payload.typ === 'access' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Refresh tokens are opaque random strings; only an HMAC of them is stored in the database. */
export function createRefreshToken() {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string) {
  return crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}

function baseCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction || env.COOKIE_SAME_SITE === 'none',
    // "none" is only needed when the frontend and API are on different sites; the Origin check in
    // middleware/origin.ts still blocks cross-site request forgery in that case.
    sameSite: env.COOKIE_SAME_SITE,
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookie(), path: '/', maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookie(), path: '/api/auth', maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: '/api/auth' });
}
