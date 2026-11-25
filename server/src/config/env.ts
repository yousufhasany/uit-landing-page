import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

function findServerRoot(start: string) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === '@uit/server') return dir;
      } catch {
        // keep walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const serverRoot = findServerRoot(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(serverRoot, '..');
// Tests keep the local database and local disk. Neon credentials live in the repo-root env file.
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });
dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BACKEND_URL: z.string().default('http://localhost:4000'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  CLOUDINARY_FOLDER: z.string().default('uit'),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_ENDPOINT_URL_S3: z.string().optional().default(''),
  AWS_REGION: z.string().optional().default(''),
  NEON_STORAGE_BUCKET: z.string().default('uploads'),
  MAX_IMAGE_MB: z.coerce.number().positive().default(10),
  MAX_VIDEO_MB: z.coerce.number().positive().default(100),
}).superRefine((e, ctx) => {
  if (e.NODE_ENV !== 'production') return;
  const neonStorage = Boolean(e.AWS_ACCESS_KEY_ID && e.AWS_SECRET_ACCESS_KEY && e.AWS_ENDPOINT_URL_S3 && e.AWS_REGION);
  const cloudinary = Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
  if (!neonStorage && !cloudinary) {
    ctx.addIssue({ code: 'custom', path: ['AWS_ACCESS_KEY_ID'], message: 'Production needs Neon Object Storage (AWS_*) or Cloudinary credentials. Local disk storage is for development only.' });
  }
  if (e.JWT_SECRET === e.JWT_REFRESH_SECRET) ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Must differ from JWT_SECRET' });
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const cloudinaryEnabled = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
export const neonStorageEnabled = Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_ENDPOINT_URL_S3 && env.AWS_REGION);
export const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
