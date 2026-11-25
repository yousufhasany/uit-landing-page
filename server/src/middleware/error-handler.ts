import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { Prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
    return res.status(422).json({ error: { message: 'Please correct the highlighted fields', fields } });
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: { message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | string | undefined) ?? 'value';
      return res.status(409).json({ error: { message: `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists` } });
    }
    if (err.code === 'P2025') return res.status(404).json({ error: { message: 'Record not found' } });
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({ error: { message: 'This record is still referenced by other content and cannot be removed' } });
    }
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: isProduction ? 'Something went wrong' : String((err as Error)?.message ?? err) } });
}
