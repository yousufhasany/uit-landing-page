import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

const serverRoot = import.meta.dirname;
const repoRoot = path.resolve(serverRoot, '..');
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: path.join(repoRoot, '.env.local') });
dotenv.config({ path: path.join(serverRoot, '.env') });

// Migrations need a direct connection. The running API uses the pooled DATABASE_URL.
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url: databaseUrl },
});
