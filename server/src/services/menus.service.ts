import type { Request } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { badRequest, notFound } from '../utils/http.js';
import { safeUrl } from '../validators/content-blocks.js';
import { logActivity } from './activity.service.js';

export const menuItemInput = z
  .object({
    label: z.string().trim().min(1).max(60),
    url: safeUrl.nullable().optional(),
    pageId: z.string().uuid().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    description: z.string().trim().max(160).nullable().optional(),
    target: z.enum(['SELF', 'BLANK']).default('SELF'),
    isVisible: z.boolean().default(true),
  })
  .refine((i) => Boolean(i.url) || Boolean(i.pageId) || i.parentId === null || i.parentId === undefined, {
    message: 'Provide a link or choose a page',
    path: ['url'],
  });

export const menuTreeInput = z.object({
  items: z.array(z.object({ id: z.string().uuid(), parentId: z.string().uuid().nullable() })).max(300),
});

type Item = Prisma.NavigationItemGetPayload<{ include: { page: { select: { slug: true; title: true; status: true } } } }>;

export interface MenuNode {
  id: string;
  label: string;
  url: string;
  description: string | null;
  target: 'SELF' | 'BLANK';
  isVisible: boolean;
  pageId: string | null;
  rawUrl: string | null;
  children: MenuNode[];
}

function buildTree(items: Item[], includeHidden: boolean): MenuNode[] {
  const nodes = new Map<string, MenuNode>();
  for (const item of items) {
    if (!includeHidden && !item.isVisible) continue;
    if (!includeHidden && item.page && item.page.status !== 'PUBLISHED') continue;
    nodes.set(item.id, {
      id: item.id,
      label: item.label,
      url: item.page ? `/${item.page.slug}` : item.url ?? '#',
      rawUrl: item.url,
      pageId: item.pageId,
      description: item.description,
      target: item.target,
      isVisible: item.isVisible,
      children: [],
    });
  }
  const roots: MenuNode[] = [];
  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (item.parentId && !parent) continue;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}

async function loadItems(menuId: string) {
  return prisma.navigationItem.findMany({
    where: { menuId },
    include: { page: { select: { slug: true, title: true, status: true } } },
    orderBy: [{ displayOrder: 'asc' }],
  });
}

export const menusService = {
  async publicMenus() {
    const menus = await prisma.navigationMenu.findMany();
    const result: Record<string, { name: string; location: string; items: MenuNode[] }> = {};
    for (const menu of menus) result[menu.key] = { name: menu.name, location: menu.location, items: buildTree(await loadItems(menu.id), false) };
    return result;
  },

  async list() {
    return prisma.navigationMenu.findMany({ orderBy: [{ location: 'asc' }, { name: 'asc' }], include: { _count: { select: { items: true } } } });
  },

  async get(id: string) {
    const menu = await prisma.navigationMenu.findUnique({ where: { id } });
    if (!menu) throw notFound('Menu');
    return { ...menu, items: buildTree(await loadItems(id), true) };
  },

  async addItem(req: Request, menuId: string, input: z.infer<typeof menuItemInput>) {
    if (input.parentId) await this.assertInMenu(menuId, input.parentId);
    const max = await prisma.navigationItem.aggregate({ where: { menuId, parentId: input.parentId ?? null }, _max: { displayOrder: true } });
    const item = await prisma.navigationItem.create({ data: { ...input, menuId, displayOrder: (max._max.displayOrder ?? -1) + 1 } });
    await logActivity(req, { action: 'CREATE', entityType: 'menu', entityId: menuId, summary: `Added menu item "${item.label}"` });
    return this.get(menuId);
  },

  async updateItem(req: Request, menuId: string, itemId: string, input: z.infer<typeof menuItemInput>) {
    if (input.parentId === itemId) throw badRequest('An item cannot be its own parent');
    if (input.parentId) await this.assertInMenu(menuId, input.parentId);
    const item = await prisma.navigationItem.update({ where: { id: itemId, menuId }, data: input });
    await logActivity(req, { action: 'UPDATE', entityType: 'menu', entityId: menuId, summary: `Updated menu item "${item.label}"` });
    return this.get(menuId);
  },

  async removeItem(req: Request, menuId: string, itemId: string) {
    const item = await prisma.navigationItem.delete({ where: { id: itemId, menuId } });
    await logActivity(req, { action: 'DELETE', entityType: 'menu', entityId: menuId, summary: `Removed menu item "${item.label}" and its sub-items` });
    return this.get(menuId);
  },

  /** Saves a full drag-and-drop arrangement: array order is display order within each parent. */
  async saveTree(req: Request, menuId: string, items: z.infer<typeof menuTreeInput>['items']) {
    const ids = new Set(items.map((i) => i.id));
    for (const i of items) if (i.parentId && !ids.has(i.parentId)) throw badRequest('Invalid parent in menu structure');
    const depth = (id: string, seen = new Set<string>()): number => {
      const parent = items.find((i) => i.id === id)?.parentId;
      if (!parent) return 0;
      if (seen.has(parent)) throw badRequest('Menu structure contains a loop');
      seen.add(parent);
      return 1 + depth(parent, seen);
    };
    if (items.some((i) => depth(i.id) > 1)) throw badRequest('Menus support two levels: top items and one level of sub-items');
    const counters = new Map<string, number>();
    await prisma.$transaction(
      items.map((i) => {
        const key = i.parentId ?? 'root';
        const order = counters.get(key) ?? 0;
        counters.set(key, order + 1);
        return prisma.navigationItem.update({ where: { id: i.id, menuId }, data: { parentId: i.parentId, displayOrder: order } });
      }),
    );
    await logActivity(req, { action: 'REORDER', entityType: 'menu', entityId: menuId, summary: 'Reordered navigation menu' });
    return this.get(menuId);
  },

  async assertInMenu(menuId: string, itemId: string) {
    const parent = await prisma.navigationItem.findFirst({ where: { id: itemId, menuId } });
    if (!parent) throw badRequest('Parent item does not belong to this menu');
    if (parent.parentId) throw badRequest('Menus support two levels: top items and one level of sub-items');
  },
};
