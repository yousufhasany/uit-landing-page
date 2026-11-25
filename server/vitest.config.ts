import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is required to run the tests (see .env.example)');

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: './tests/global-setup.ts',
    // Files share one database, so they run one at a time; each file resets the data it needs.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      UPLOAD_DIR: path.join(os.tmpdir(), 'uit-test-uploads'),
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      FRONTEND_URL: 'http://localhost:5173',
    },
  },
});
