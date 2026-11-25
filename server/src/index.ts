import { createApp } from './app.js';
import { cloudinaryEnabled, env, neonStorageEnabled } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { refreshTokenRepository } from './repositories/user.repository.js';

const app = createApp();
export default app;

// Vercel runs the default export. Local `npm start` is the process that listens.
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    const storage = neonStorageEnabled ? 'Neon Object Storage' : cloudinaryEnabled ? 'Cloudinary' : 'local disk';
    console.log(`UIT API listening on ${env.BACKEND_URL} (${env.NODE_ENV}); media storage: ${storage}`);
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
}
