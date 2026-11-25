import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { PermissionKey } from '../config/permissions.js';
import { requireAnyPermission, requirePermission } from '../middleware/auth.js';
import type { ResourceService } from '../services/resource.factory.js';

const idParam = z.object({ id: z.string().uuid() });
const orderBody = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

interface Options {
  manage: PermissionKey;
  /** Extra permissions that may read the admin list (e.g. academics.view). */
  viewers?: PermissionKey[];
  publicList?: boolean;
  publicSlug?: boolean;
}

/** Standard REST surface: public reads, permission-guarded admin reads and writes. */
export function resourceRouter(service: ResourceService, options: Options) {
  const router = Router();
  const canView = requireAnyPermission(options.manage, ...(options.viewers ?? []));
  const canManage = requirePermission(options.manage);

  router.get('/admin', canView, async (req: Request, res: Response) => {
    res.json(await service.list(req.query as Record<string, unknown>));
  });
  router.get('/admin/:id', canView, async (req, res) => {
    res.json(await service.get(idParam.parse(req.params).id));
  });
  router.post('/', canManage, async (req, res) => {
    res.status(201).json(await service.create(req, req.body));
  });
  router.put('/order', canManage, async (req, res) => {
    await service.reorder(req, orderBody.parse(req.body).ids);
    res.status(204).end();
  });
  router.put('/:id', canManage, async (req, res) => {
    res.json(await service.update(req, idParam.parse(req.params).id, req.body));
  });
  router.delete('/:id', canManage, async (req, res) => {
    await service.remove(req, idParam.parse(req.params).id);
    res.status(204).end();
  });

  if (options.publicList !== false) {
    router.get('/', async (req, res) => {
      res.json(await service.list(req.query as Record<string, unknown>, true));
    });
  }
  if (options.publicSlug) {
    router.get('/:slug', async (req, res) => {
      res.json(await service.getPublicBySlug(z.string().max(160).parse(req.params.slug)));
    });
  }
  return router;
}
