import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins, env } from '../config/env.js';
import { forbidden } from '../utils/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated requests: browsers always send Origin on state-changing
 * requests, so any unsafe request carrying a foreign Origin is rejected.
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin?.replace(/\/$/, '');
  if (origin && !allowedOrigins.includes(origin) && origin !== env.BACKEND_URL.replace(/\/$/, '')) {
    throw forbidden('Request origin is not allowed');
  }
  next();
}
