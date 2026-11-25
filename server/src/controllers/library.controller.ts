import type { Request, Response } from 'express';
import { z } from 'zod';
import { badRequest } from '../utils/http.js';
import { galleryInput, galleryItemUpdate, galleryItemsInput, galleryService } from '../services/gallery.service.js';
import { mediaService } from '../services/media.service.js';
import { menuItemInput, menuTreeInput, menusService } from '../services/menus.service.js';
import { folderSchema, mediaListQuery, mediaUpdateSchema, mediaUploadFields } from '../validators/media.validators.js';

const id = (req: Request, key = 'id') => z.string().uuid().parse(req.params[key]);

export const mediaController = {
  list: async (req: Request, res: Response) => res.json(await mediaService.list(mediaListQuery.parse(req.query))),
  facets: async (_req: Request, res: Response) => res.json(await mediaService.facets()),
  get: async (req: Request, res: Response) => res.json(await mediaService.get(id(req))),
  upload: async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) throw badRequest('Choose at least one file to upload');
    const fields = mediaUploadFields.parse(req.body ?? {});
    const results: unknown[] = [];
    const errors: { file: string; message: string }[] = [];
    for (const file of files) {
      try {
        results.push(await mediaService.upload(req, file, { ...fields, altText: fields.altText ?? '' }));
      } catch (error) {
        errors.push({ file: file.originalname, message: (error as Error).message });
      }
    }
    res.status(results.length ? 201 : 400).json({ items: results, errors });
  },
  replace: async (req: Request, res: Response) => {
    if (!req.file) throw badRequest('Choose a replacement file');
    res.json(await mediaService.replace(req, id(req), req.file));
  },
  update: async (req: Request, res: Response) => res.json(await mediaService.update(req, id(req), mediaUpdateSchema.parse(req.body))),
  remove: async (req: Request, res: Response) => {
    await mediaService.remove(req, id(req));
    res.status(204).end();
  },
  createFolder: async (req: Request, res: Response) => {
    const body = folderSchema.parse(req.body);
    res.status(201).json(await mediaService.createFolder(req, body.name, body.parentId));
  },
  renameFolder: async (req: Request, res: Response) => res.json(await mediaService.renameFolder(req, id(req), folderSchema.parse(req.body).name)),
  deleteFolder: async (req: Request, res: Response) => {
    await mediaService.deleteFolder(req, id(req));
    res.status(204).end();
  },
};

export const galleryController = {
  publicList: async (req: Request, res: Response) =>
    res.json(await galleryService.listPublic(typeof req.query.category === 'string' ? req.query.category : undefined)),
  publicGet: async (req: Request, res: Response) => res.json(await galleryService.getPublic(z.string().max(160).parse(req.params.slug))),
  list: async (_req: Request, res: Response) => res.json(await galleryService.listAdmin()),
  get: async (req: Request, res: Response) => res.json(await galleryService.getAdmin(id(req))),
  create: async (req: Request, res: Response) => res.status(201).json(await galleryService.create(req, galleryInput.parse(req.body))),
  update: async (req: Request, res: Response) => res.json(await galleryService.update(req, id(req), galleryInput.parse(req.body))),
  remove: async (req: Request, res: Response) => {
    await galleryService.remove(req, id(req));
    res.status(204).end();
  },
  addItems: async (req: Request, res: Response) => res.json(await galleryService.addItems(req, id(req), galleryItemsInput.parse(req.body).mediaIds)),
  updateItem: async (req: Request, res: Response) => res.json(await galleryService.updateItem(req, id(req, 'itemId'), galleryItemUpdate.parse(req.body))),
  removeItem: async (req: Request, res: Response) => {
    await galleryService.removeItem(req, id(req, 'itemId'));
    res.status(204).end();
  },
  reorder: async (req: Request, res: Response) =>
    res.json(await galleryService.reorderItems(req, id(req), z.object({ ids: z.array(z.string().uuid()) }).parse(req.body).ids)),
};

export const menusController = {
  list: async (_req: Request, res: Response) => res.json(await menusService.list()),
  get: async (req: Request, res: Response) => res.json(await menusService.get(id(req))),
  addItem: async (req: Request, res: Response) => res.status(201).json(await menusService.addItem(req, id(req), menuItemInput.parse(req.body))),
  updateItem: async (req: Request, res: Response) => res.json(await menusService.updateItem(req, id(req), id(req, 'itemId'), menuItemInput.parse(req.body))),
  removeItem: async (req: Request, res: Response) => res.json(await menusService.removeItem(req, id(req), id(req, 'itemId'))),
  saveTree: async (req: Request, res: Response) => res.json(await menusService.saveTree(req, id(req), menuTreeInput.parse(req.body).items)),
};
