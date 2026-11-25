/**
 * Starts a real PostgreSQL 17 server for local development, without Docker or a system install.
 * Data persists in server/.pgdata. Production uses a managed PostgreSQL via DATABASE_URL instead.
 *
 *   npm run db         (keep this terminal open)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = path.join(root, '.pgdata');
const port = Number(process.env.DEV_DB_PORT ?? 5433);
const databases = ['uit', 'uit_test'];

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'uit',
  password: 'uit_local_dev',
  port,
  persistent: true,
  onLog: () => {},
});

async function main() {
  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    console.log('Initialising PostgreSQL data directory…');
    await pg.initialise();
  }
  await pg.start();

  const client = pg.getPgClient();
  await client.connect();
  for (const name of databases) {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (!rowCount) {
      await pg.createDatabase(name);
      console.log(`Created database "${name}"`);
    }
  }
  await client.end();

  console.log(`PostgreSQL running on postgresql://uit:uit_local_dev@localhost:${port}/uit`);
  console.log('Press Ctrl+C to stop.');

  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch(async (error) => {
  console.error(error);
  await pg.stop().catch(() => {});
  process.exit(1);
});
