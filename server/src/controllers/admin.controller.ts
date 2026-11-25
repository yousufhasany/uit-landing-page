import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { activityService } from '../services/activity.service.js';
import { programService } from '../services/resources.js';
import { facultyService } from '../services/resources.js';
import { settingsService } from '../services/settings.service.js';
import { buildSitemap, dashboardService, searchService } from '../services/site.service.js';
import { passwordResetInput, roleInput, rolesService, userCreateInput, userListQuery, userUpdateInput, usersService } from '../services/users.service.js';
import { paginationQuery } from '../utils/pagination.js';

const id = (req: Request) => z.string().uuid().parse(req.params.id);

export const siteController = {
  site: async (_req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(await settingsService.publicSite());
  },
  settings: async (_req: Request, res: Response) => res.json(await settingsService.getAll()),
  updateSetting: async (req: Request, res: Response) => res.json(await settingsService.update(req, z.string().max(60).parse(req.params.key), req.body)),
  search: async (req: Request, res: Response) => {
    const q = z.string().trim().min(2, 'Enter at least 2 characters').max(100).parse(req.query.q);
    res.json({ q, results: await searchService.search(q) });
  },
  academics: async (_req: Request, res: Response) => {
    const [faculties, programs] = await Promise.all([facultyService.allPublic(), programService.allPublic()]);
    res.json({ faculties, programs });
  },
  dashboard: async (_req: Request, res: Response) => res.json(await dashboardService.overview()),
  activity: async (req: Request, res: Response) => {
    const query = paginationQuery.extend({ entityType: z.string().max(40).optional(), userId: z.string().uuid().optional(), action: z.string().max(40).optional() }).parse(req.query);
    res.json(await activityService.list(query));
  },
  sitemap: async (_req: Request, res: Response) => {
    const settings = await settingsService.getAll();
    res.type('application/xml').send(await buildSitemap(settings['site.seo'].siteUrl || env.FRONTEND_URL.split(',')[0]));
  },
  robots: async (_req: Request, res: Response) => {
    const settings = await settingsService.getAll();
    const site = (settings['site.seo'].siteUrl || env.FRONTEND_URL.split(',')[0]).replace(/\/$/, '');
    res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  },
};

export const usersController = {
  list: async (req: Request, res: Response) => res.json(await usersService.list(userListQuery.parse(req.query))),
  create: async (req: Request, res: Response) => res.status(201).json(await usersService.create(req, userCreateInput.parse(req.body))),
  update: async (req: Request, res: Response) => res.json(await usersService.update(req, id(req), userUpdateInput.parse(req.body))),
  resetPassword: async (req: Request, res: Response) => {
    await usersService.resetPassword(req, id(req), passwordResetInput.parse(req.body).password);
    res.status(204).end();
  },
  remove: async (req: Request, res: Response) => {
    await usersService.remove(req, id(req));
    res.status(204).end();
  },
};

export const rolesController = {
  list: async (_req: Request, res: Response) => res.json(await rolesService.list()),
  permissions: async (_req: Request, res: Response) => res.json(await rolesService.permissions()),
  create: async (req: Request, res: Response) => res.status(201).json(await rolesService.create(req, roleInput.parse(req.body))),
  update: async (req: Request, res: Response) => res.json(await rolesService.update(req, id(req), roleInput.parse(req.body))),
  remove: async (req: Request, res: Response) => {
    await rolesService.remove(req, id(req));
    res.status(204).end();
  },
};
