import { attachDatabasePool } from '@vercel/functions';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Vercel Fluid reuses this pool, then attachDatabasePool closes idle clients before the function suspends.
  // A local server can keep a few connections. Neon still pools in front of Postgres when DATABASE_URL uses -pooler.
  max: process.env.VERCEL ? 1 : 10,
});

if (process.env.VERCEL) attachDatabasePool(pool);

export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
export type Db = typeof prisma | Tx;

export * from '../generated/prisma/client.js';
