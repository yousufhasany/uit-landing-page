import type { Request } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '../lib/prisma.js';
import { badRequest } from '../utils/http.js';
import { mediaRef, safeUrl } from '../validators/content-blocks.js';
import { logActivity } from './activity.service.js';
import { resolveMediaMap } from './media.service.js';
import { menusService } from './menus.service.js';
import { announcementService, contactService, socialLinkService } from './resources.js';

export const SETTING_SCHEMAS = {
  'site.identity': z.object({
    name: z.string().trim().min(2).max(120),
    shortName: z.string().trim().min(1).max(20),
    tagline: z.string().trim().max(200).default(''),
    description: z.string().trim().max(600).default(''),
    statusNote: z.string().trim().max(400).default(''),
    logoId: mediaRef,
    logoOnDarkId: mediaRef,
  }),
  'site.header': z.object({
    ctaLabel: z.string().trim().max(40).default(''),
    ctaUrl: safeUrl.default(''),
    showSearch: z.boolean().default(true),
  }),
  'site.footer': z.object({
    description: z.string().trim().max(600).default(''),
    copyright: z.string().trim().max(200).default(''),
    note: z.string().trim().max(400).default(''),
  }),
  'site.seo': z.object({
    titleTemplate: z.string().trim().max(80).default('%s | University of Integrated Thought'),
    defaultTitle: z.string().trim().max(80).default(''),
    defaultDescription: z.string().trim().max(170).default(''),
    ogImageId: mediaRef,
    siteUrl: z.string().trim().max(200).default(''),
  }),
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;
const SETTING_GROUPS: Record<SettingKey, string> = {
  'site.identity': 'Identity',
  'site.header': 'Header',
  'site.footer': 'Footer',
  'site.seo': 'SEO',
};

export const settingsService = {
  async getAll() {
    const rows = await prisma.siteSetting.findMany();
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(SETTING_SCHEMAS) as SettingKey[]) {
      const row = rows.find((r) => r.key === key);
      const parsed = SETTING_SCHEMAS[key].safeParse(row?.value ?? {});
      result[key] = parsed.success ? parsed.data : row?.value ?? {};
    }
    return result as { [K in SettingKey]: z.infer<(typeof SETTING_SCHEMAS)[K]> };
  },

  async update(req: Request, key: string, value: unknown) {
    if (!(key in SETTING_SCHEMAS)) throw badRequest(`Unknown setting ${key}`);
    const k = key as SettingKey;
    const data = SETTING_SCHEMAS[k].parse(value) as Prisma.InputJsonValue;
    await prisma.siteSetting.upsert({ where: { key }, update: { value: data }, create: { key, value: data, group: SETTING_GROUPS[k] } });
    await logActivity(req, { action: 'UPDATE', entityType: 'settings', entityId: null, summary: `Updated ${SETTING_GROUPS[k]} settings` });
    return data;
  },

  /** Everything the public layout needs in one request. */
  async publicSite() {
    const [settings, menus, social, contacts, announcements] = await Promise.all([
      this.getAll(),
      menusService.publicMenus(),
      socialLinkService.allPublic(),
      contactService.allPublic(),
      announcementService.allPublic({}, 3),
    ]);
    const identity = settings['site.identity'];
    const seo = settings['site.seo'];
    const media = await resolveMediaMap([identity.logoId, identity.logoOnDarkId, seo.ogImageId]);
    return {
      identity: { ...identity, logo: media.get(identity.logoId ?? '') ?? null, logoOnDark: media.get(identity.logoOnDarkId ?? '') ?? null },
      header: settings['site.header'],
      footer: settings['site.footer'],
      seo: { ...seo, ogImage: media.get(seo.ogImageId ?? '') ?? null },
      menus,
      social,
      contacts,
      announcements,
    };
  },
};
