import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { env } from '../config/env.js';
import { siteController, rolesController, usersController } from '../controllers/admin.controller.js';
import { authController } from '../controllers/auth.controller.js';
import { eventsController, homepageController, newsController, pagesController } from '../controllers/content.controller.js';
import { galleryController, mediaController, menusController } from '../controllers/library.controller.js';
import { resourceRouter } from '../controllers/resource.controller.js';
import { ALLOWED_MIME_TYPES } from '../lib/storage.js';
import { requireAnyPermission, requireAuth, requirePermission as can } from '../middleware/auth.js';
import { badRequest } from '../utils/http.js';
import {
  announcementService,
  campusService,
  centerService,
  contactService,
  departmentService,
  facultyService,
  programService,
  researchService,
  socialLinkService,
} from '../services/resources.js';

const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: env.NODE_ENV === 'test' ? 500 : 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Try again in a few minutes.' } });
const uploadLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Upload limit reached. Try again later.' } });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_VIDEO_MB * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => (ALLOWED_MIME_TYPES.includes(file.mimetype) ? cb(null, true) : cb(badRequest(`File type ${file.mimetype} is not allowed`))),
});

const auth = Router();
auth.post('/login', loginLimiter, authController.login);
auth.post('/refresh', authController.refresh);
auth.post('/logout', authController.logout);
auth.get('/me', requireAuth, authController.me);
auth.post('/change-password', requireAuth, loginLimiter, authController.changePassword);

const homepage = Router();
homepage.get('/', homepageController.published);
homepage.get('/preview', can('homepage.view'), homepageController.preview);
homepage.get('/builder', can('homepage.view'), homepageController.builder);
homepage.post('/sections', can('homepage.edit'), homepageController.addSection);
homepage.get('/sections/:id', can('homepage.view'), homepageController.section);
homepage.patch('/sections/:id', can('homepage.edit'), homepageController.updateSection);
homepage.delete('/sections/:id', can('homepage.edit'), homepageController.removeSection);
homepage.post('/sections/:id/restore', can('homepage.edit'), homepageController.restoreSection);
homepage.put('/order', can('homepage.edit'), homepageController.reorder);
homepage.post('/publish', can('homepage.publish'), homepageController.publish);
homepage.post('/discard', can('homepage.edit'), homepageController.discard);
homepage.post('/revisions/:id/restore', can('homepage.publish'), homepageController.restoreRevision);

const pages = Router();
pages.get('/public', pagesController.publicBySlug);
pages.get('/admin', can('pages.view'), pagesController.list);
pages.get('/admin/:id', can('pages.view'), pagesController.get);
pages.get('/admin/:id/preview', can('pages.view'), pagesController.preview);
pages.post('/', can('pages.create'), pagesController.create);
pages.put('/:id', can('pages.edit'), pagesController.saveDraft);
pages.post('/:id/publish', can('pages.publish'), pagesController.publish);
pages.post('/:id/unpublish', can('pages.publish'), pagesController.unpublish);
pages.post('/:id/archive', can('pages.publish'), pagesController.archive);
pages.post('/:id/discard', can('pages.edit'), pagesController.discard);
pages.post('/:id/revisions/:revisionId/restore', can('pages.edit'), pagesController.restoreRevision);
pages.delete('/:id', can('pages.delete'), pagesController.remove);

const news = Router();
news.get('/', newsController.publicList);
news.get('/categories', newsController.categories);
news.post('/categories', can('news.edit'), newsController.createCategory);
news.put('/categories/:id', can('news.edit'), newsController.updateCategory);
news.delete('/categories/:id', can('news.delete'), newsController.deleteCategory);
news.get('/admin', can('news.view'), newsController.list);
news.get('/admin/:id', can('news.view'), newsController.get);
news.post('/', can('news.create'), newsController.create);
news.put('/:id', can('news.edit'), newsController.update);
news.post('/:id/status', requireAnyPermission('news.edit', 'news.publish'), newsController.setStatus);
news.delete('/:id', can('news.delete'), newsController.remove);
news.get('/:slug', newsController.publicGet);

const events = Router();
events.get('/', eventsController.publicList);
events.get('/categories', eventsController.categories);
events.post('/categories', can('events.manage'), eventsController.createCategory);
events.put('/categories/:id', can('events.manage'), eventsController.updateCategory);
events.delete('/categories/:id', can('events.manage'), eventsController.deleteCategory);
events.get('/admin', requireAnyPermission('events.view', 'events.manage'), eventsController.list);
events.get('/admin/:id', requireAnyPermission('events.view', 'events.manage'), eventsController.get);
events.post('/', can('events.manage'), eventsController.create);
events.put('/:id', can('events.manage'), eventsController.update);
events.post('/:id/status', requireAnyPermission('events.manage', 'events.publish'), eventsController.setStatus);
events.delete('/:id', can('events.manage'), eventsController.remove);
events.get('/:slug', eventsController.publicGet);

const media = Router();
media.get('/', can('media.view'), mediaController.list);
media.get('/facets', can('media.view'), mediaController.facets);
media.post('/folders', can('media.edit'), mediaController.createFolder);
media.patch('/folders/:id', can('media.edit'), mediaController.renameFolder);
media.delete('/folders/:id', can('media.delete'), mediaController.deleteFolder);
media.get('/:id', can('media.view'), mediaController.get);
media.post('/', can('media.upload'), uploadLimiter, upload.array('files', 20), mediaController.upload);
media.post('/:id/replace', can('media.upload'), can('media.edit'), uploadLimiter, upload.single('file'), mediaController.replace);
media.patch('/:id', can('media.edit'), mediaController.update);
media.delete('/:id', can('media.delete'), mediaController.remove);

const gallery = Router();
gallery.get('/', galleryController.publicList);
gallery.get('/admin', can('gallery.manage'), galleryController.list);
gallery.get('/admin/:id', can('gallery.manage'), galleryController.get);
gallery.post('/', can('gallery.manage'), galleryController.create);
gallery.put('/:id', can('gallery.manage'), galleryController.update);
gallery.delete('/:id', can('gallery.manage'), galleryController.remove);
gallery.post('/:id/items', can('gallery.manage'), galleryController.addItems);
gallery.put('/:id/order', can('gallery.manage'), galleryController.reorder);
gallery.patch('/items/:itemId', can('gallery.manage'), galleryController.updateItem);
gallery.delete('/items/:itemId', can('gallery.manage'), galleryController.removeItem);
gallery.get('/:slug', galleryController.publicGet);

const menus = Router();
menus.use(can('menus.manage'));
menus.get('/', menusController.list);
menus.get('/:id', menusController.get);
menus.post('/:id/items', menusController.addItem);
menus.put('/:id/items/:itemId', menusController.updateItem);
menus.delete('/:id/items/:itemId', menusController.removeItem);
menus.put('/:id/tree', menusController.saveTree);

const users = Router();
users.use(can('users.manage'));
users.get('/', usersController.list);
users.post('/', usersController.create);
users.put('/:id', usersController.update);
users.post('/:id/password', usersController.resetPassword);
users.delete('/:id', usersController.remove);

const roles = Router();
roles.get('/', requireAnyPermission('roles.manage', 'users.manage'), rolesController.list);
roles.post('/', can('roles.manage'), rolesController.create);
roles.put('/:id', can('roles.manage'), rolesController.update);
roles.delete('/:id', can('roles.manage'), rolesController.remove);

export const apiRouter = Router();
apiRouter.get('/health', (_req, res) => res.json({ ok: true }));
apiRouter.use('/auth', auth);
apiRouter.get('/site', siteController.site);
apiRouter.get('/search', siteController.search);
apiRouter.get('/academics', siteController.academics);
apiRouter.use('/homepage', homepage);
apiRouter.use('/pages', pages);
apiRouter.use('/news', news);
apiRouter.use('/events', events);
apiRouter.use('/faculties', resourceRouter(facultyService, { manage: 'academics.manage', viewers: ['academics.view'], publicSlug: true }));
apiRouter.use('/departments', resourceRouter(departmentService, { manage: 'academics.manage', viewers: ['academics.view'], publicSlug: true }));
apiRouter.use('/programs', resourceRouter(programService, { manage: 'academics.manage', viewers: ['academics.view'], publicSlug: true }));
apiRouter.use('/centers', resourceRouter(centerService, { manage: 'centers.manage', publicSlug: true }));
apiRouter.use('/research', resourceRouter(researchService, { manage: 'research.manage', publicSlug: true }));
apiRouter.use('/campus', resourceRouter(campusService, { manage: 'campus.manage', publicSlug: true }));
apiRouter.use('/announcements', resourceRouter(announcementService, { manage: 'announcements.manage' }));
apiRouter.use('/social-links', resourceRouter(socialLinkService, { manage: 'social.manage' }));
apiRouter.use('/contacts', resourceRouter(contactService, { manage: 'contact.manage' }));
apiRouter.use('/gallery', gallery);
apiRouter.use('/media', media);
apiRouter.use('/menus', menus);
apiRouter.get('/settings', can('settings.manage'), siteController.settings);
apiRouter.put('/settings/:key', can('settings.manage'), siteController.updateSetting);
apiRouter.use('/users', users);
apiRouter.use('/roles', roles);
apiRouter.get('/permissions', requireAnyPermission('roles.manage', 'users.manage'), rolesController.permissions);
apiRouter.get('/activity-logs', can('logs.view'), siteController.activity);
apiRouter.get('/dashboard', can('dashboard.view'), siteController.dashboard);
