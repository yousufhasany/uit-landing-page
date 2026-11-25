import { createApp } from './app.js';
import { cloudinaryEnabled, env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { refreshTokenRepository } from './repositories/user.repository.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`UIT API listening on ${env.BACKEND_URL} (${env.NODE_ENV}); media storage: ${cloudinaryEnabled ? 'Cloudinary' : 'local disk'}`);
});

const purge = setInterval(() => void refreshTokenRepository.purgeExpired().catch(() => undefined), 6 * 3_600_000);

async function shutdown() {
  clearInterval(purge);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
