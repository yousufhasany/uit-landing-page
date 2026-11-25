import './lib/zod-messages.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { allowedOrigins, isProduction } from './config/env.js';
import { siteController } from './controllers/admin.controller.js';
import { UPLOAD_DIR } from './lib/storage.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { verifyOrigin } from './middleware/origin.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], imgSrc: ["'self'", 'data:'], frameAncestors: ["'none'"] } },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin.replace(/\/$/, ''))),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: false, index: false, dotfiles: 'deny' }),
  );
  app.get('/sitemap.xml', siteController.sitemap);
  app.get('/robots.txt', siteController.robots);

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60_000, limit: isProduction ? 1500 : 10_000, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please slow down.' } }),
    verifyOrigin,
    authenticate,
    (_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    apiRouter,
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
