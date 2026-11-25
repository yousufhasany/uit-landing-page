import { execSync } from 'node:child_process';
import 'dotenv/config';

/** Applies migrations to the dedicated test database. Refuses to touch any database not named *_test. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL!;
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) throw new Error(`Refusing to run tests against "${name}": the test database name must end with _test`);
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: 'pipe' });
}
