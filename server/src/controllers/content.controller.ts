import type { Request, Response } from 'express';
import { z } from 'zod';
import { assertPermission } from '../middleware/auth.js';
import { eventsService } from '../services/events.service.js';
import { homepageService, reorderInput, sectionCreateInput, sectionUpdateInput } from '../services/homepage.service.js';
import { newsService } from '../services/news.service.js';
import { pageContentInput, pageCreateInput, pageListQuery, pagePublishInput, pagesService } from '../services/pages.service.js';
import { categoryInput, eventInput, eventListQuery, newsInput, newsListQuery, statusEnum } from '../validators/news-events.validators.js';

const id = (req: Request, key = 'id') => z.string().uuid().parse(req.params[key]);
const statusBody = z.object({ status: statusEnum, publishedAt: z.coerce.date().nullable().optional() });

export const homepageController = {
  published: async (_req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json(await homepageService.getPublished());
  },
  preview: async (_req: Request, res: Response) => res.json(await homepageService.getPreview()),
  builder: async (_req: Request, res: Response) => res.json(await homepageService.getBuilder()),
  section: async (req: Request, res: Response) => res.json(await homepageService.getSection(id(req))),
  updateSection: async (req: Request, res: Response) => res.json(await homepageService.updateSection(req, id(req), sectionUpdateInput.parse(req.body))),
  addSection: async (req: Request, res: Response) => res.status(201).json(await homepageService.addSection(req, sectionCreateInput.parse(req.body))),
  removeSection: async (req: Request, res: Response) => {
    await homepageService.removeSection(req, id(req));
    res.status(204).end();
  },
  restoreSection: async (req: Request, res: Response) => {
    await homepageService.restoreSection(req, id(req));
    res.status(204).end();
  },
  reorder: async (req: Request, res: Response) => {
    await homepageService.reorder(req, reorderInput.parse(req.body).ids);
    res.status(204).end();
  },
  publish: async (req: Request, res: Response) => res.json(await homepageService.publish(req)),
  discard: async (req: Request, res: Response) => res.json(await homepageService.discardDraft(req)),
  restoreRevision: async (req: Request, res: Response) => res.json(await homepageService.restoreRevision(req, id(req))),
};

export const pagesController = {
  publicBySlug: async (req: Request, res: Response) => {
    const slug = z.string().trim().min(1).max(160).parse(req.query.slug);
    res.json(await pagesService.getPublic(slug.replace(/^\/+|\/+$/g, '')));
  },
  list: async (req: Request, res: Response) => res.json(await pagesService.listAdmin(pageListQuery.parse(req.query))),
  get: async (req: Request, res: Response) => res.json(await pagesService.getAdmin(id(req))),
  preview: async (req: Request, res: Response) => res.json(await pagesService.preview(id(req))),
  create: async (req: Request, res: Response) => res.status(201).json(await pagesService.create(req, pageCreateInput.parse(req.body))),
  saveDraft: async (req: Request, res: Response) => res.json(await pagesService.saveDraft(req, id(req), pageContentInput.parse(req.body))),
  publish: async (req: Request, res: Response) => res.json(await pagesService.publish(req, id(req), pagePublishInput.parse(req.body ?? {}))),
  unpublish: async (req: Request, res: Response) => res.json(await pagesService.unpublish(req, id(req))),
  archive: async (req: Request, res: Response) => res.json(await pagesService.unpublish(req, id(req), true)),
  discard: async (req: Request, res: Response) => res.json(await pagesService.discardDraft(req, id(req))),
  restoreRevision: async (req: Request, res: Response) => res.json(await pagesService.restoreRevision(req, id(req), id(req, 'revisionId'))),
  remove: async (req: Request, res: Response) => {
    await pagesService.remove(req, id(req));
    res.status(204).end();
  },
};

export const newsController = {
  publicList: async (req: Request, res: Response) => res.json(await newsService.listPublic(newsListQuery.parse(req.query))),
  publicGet: async (req: Request, res: Response) => res.json(await newsService.getPublic(z.string().max(160).parse(req.params.slug))),
  categories: async (_req: Request, res: Response) => res.json(await newsService.categories()),
  list: async (req: Request, res: Response) => res.json(await newsService.listAdmin(newsListQuery.parse(req.query))),
  get: async (req: Request, res: Response) => res.json(await newsService.getAdmin(id(req))),
  create: async (req: Request, res: Response) => res.status(201).json(await newsService.create(req, newsInput.parse(req.body))),
  update: async (req: Request, res: Response) => res.json(await newsService.update(req, id(req), newsInput.parse(req.body))),
  setStatus: async (req: Request, res: Response) => {
    const body = statusBody.parse(req.body);
    res.json(await newsService.setStatus(req, id(req), body.status, body.publishedAt));
  },
  remove: async (req: Request, res: Response) => {
    const article = await newsService.getAdmin(id(req));
    if (article.status === 'PUBLISHED' || article.status === 'SCHEDULED') assertPermission(req, 'news.publish', 'Unpublish the article before deleting it');
    await newsService.remove(req, id(req));
    res.status(204).end();
  },
  createCategory: async (req: Request, res: Response) => res.status(201).json(await newsService.createCategory(req, categoryInput.parse(req.body))),
  updateCategory: async (req: Request, res: Response) => res.json(await newsService.updateCategory(req, id(req), categoryInput.parse(req.body))),
  deleteCategory: async (req: Request, res: Response) => {
    await newsService.deleteCategory(req, id(req));
    res.status(204).end();
  },
};

export const eventsController = {
  publicList: async (req: Request, res: Response) => res.json(await eventsService.listPublic(eventListQuery.parse(req.query))),
  publicGet: async (req: Request, res: Response) => res.json(await eventsService.getPublic(z.string().max(160).parse(req.params.slug))),
  categories: async (_req: Request, res: Response) => res.json(await eventsService.categories()),
  list: async (req: Request, res: Response) => res.json(await eventsService.listAdmin(eventListQuery.parse({ when: 'all', ...req.query }))),
  get: async (req: Request, res: Response) => res.json(await eventsService.getAdmin(id(req))),
  create: async (req: Request, res: Response) => res.status(201).json(await eventsService.create(req, eventInput.parse(req.body))),
  update: async (req: Request, res: Response) => res.json(await eventsService.update(req, id(req), eventInput.parse(req.body))),
  setStatus: async (req: Request, res: Response) => {
    const body = statusBody.parse(req.body);
    res.json(await eventsService.setStatus(req, id(req), body.status, body.publishedAt));
  },
  remove: async (req: Request, res: Response) => {
    const event = await eventsService.getAdmin(id(req));
    if (event.status === 'PUBLISHED' || event.status === 'SCHEDULED') assertPermission(req, 'events.publish', 'Unpublish the event before deleting it');
    await eventsService.remove(req, id(req));
    res.status(204).end();
  },
  createCategory: async (req: Request, res: Response) => res.status(201).json(await eventsService.createCategory(req, categoryInput.parse(req.body))),
  updateCategory: async (req: Request, res: Response) => res.json(await eventsService.updateCategory(req, id(req), categoryInput.parse(req.body))),
  deleteCategory: async (req: Request, res: Response) => {
    await eventsService.deleteCategory(req, id(req));
    res.status(204).end();
  },
};
