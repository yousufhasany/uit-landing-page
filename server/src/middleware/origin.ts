import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins, env } from '../config/env.js';
import { forbidden } from '../utils/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requestHost(req: Request) {
  return String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '').split(',')[0].trim();
}

/** Allows the configured site URLs and the host that actually served the page (needed for Vercel preview URLs). */
export function isAllowedOrigin(origin: string | undefined, host?: string) {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalized) || normalized === env.BACKEND_URL.replace(/\/$/, '')) return true;
  try {
    return Boolean(host) && new URL(normalized).host === host;
  } catch {
    return false;
  }
}

/**
 * CSRF defence for cookie-authenticated requests: browsers always send Origin on state-changing
 * requests, so any unsafe request carrying a foreign Origin is rejected.
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin?.replace(/\/$/, '');
  if (origin && !isAllowedOrigin(origin, requestHost(req))) throw forbidden('Request origin is not allowed');
  next();
}
