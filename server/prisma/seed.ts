/**
 * Idempotent seed. Safe to run repeatedly: system data (permissions, Super Admin role) is synced, and content
 * is only created when missing, so edits made in the CMS are never overwritten.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ROLES, PERMISSIONS, SUPER_ADMIN_ROLE } from '../src/config/permissions.js';
import { cloudinaryEnabled } from '../src/config/env.js';
import { storeFile } from '../src/lib/storage.js';
import { prisma, Prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/services/auth.service.js';
import { validateSectionData } from '../src/services/homepage.service.js';
import { pageContentInput } from '../src/services/pages.service.js';
import { SETTING_SCHEMAS, type SettingKey } from '../src/services/settings.service.js';
import { sanitizeRichText } from '../src/utils/sanitize.js';
import { slugify } from '../src/utils/slug.js';
import type { HomepageSectionTypeKey } from '../src/validators/content-blocks.js';
import { degreeOf, SCHOOLS } from './seed/academics.js';
import { CENTERS } from './seed/centers.js';
import { ARTICLES, NEWS_CATEGORIES } from './seed/news.js';
import { PAGES } from './seed/pages.js';
import { CAMPUS_ITEMS, CONTACTS, GALLERIES, HOMEPAGE_SECTIONS, MENUS, RESEARCH_AREAS, RESEARCH_INITIATIVES, SETTINGS } from './seed/site.js';

const ASSET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-assets');
const log = (msg: string) => console.log(`  ${msg}`);

interface ManifestEntry { file: string; title: string; alt: string; caption?: string; category: string; folder: string; tags: string[]; source: string }

const media = new Map<string, string>();
const galleryIds = new Map<string, string>();

/** Replaces "@file.jpg" with media ids and "#slug" with gallery ids, recursively. */
function resolveRefs<T>(value: T): T {
  if (typeof value === 'string') {
    if (value.startsWith('@')) {
      const id = media.get(value.slice(1));
      if (!id) throw new Error(`Seed references unknown asset ${value}`);
      return id as T;
    }
    if (value.startsWith('#') && galleryIds.has(value.slice(1))) return galleryIds.get(value.slice(1)) as T;
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveRefs) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveRefs(v)])) as T;
  return value;
}
const img = (file?: string) => (file ? resolveRefs(`@${file}`) : null);
const paragraphs = (list: string[]) => list.map((p) => `<p>${p}</p>`).join('');

async function seedAccess() {
  for (const [key, meta] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { key }, update: { group: meta.group, description: meta.description }, create: { key, ...meta } });
  }
  const permissions = await prisma.permission.findMany();
  const idOf = new Map(permissions.map((p) => [p.key, p.id]));

  for (const [key, role] of Object.entries(DEFAULT_ROLES)) {
    const existing = await prisma.role.findUnique({ where: { key } });
    if (existing && key !== SUPER_ADMIN_ROLE) continue; // keep permissions customised in the CMS
    const saved = await prisma.role.upsert({
      where: { key },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { key, name: role.name, description: role.description, isSystem: true },
    });
    await prisma.rolePermission.createMany({ data: role.permissions.map((p) => ({ roleId: saved.id, permissionId: idOf.get(p)! })), skipDuplicates: true });
  }
  log(`permissions: ${permissions.length}, roles: ${Object.keys(DEFAULT_ROLES).length}`);

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) {
    log('BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD not set: no administrator created');
    return null;
  }
  const superRole = await prisma.role.findUniqueOrThrow({ where: { key: SUPER_ADMIN_ROLE } });
  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    if (password.length < 10) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 10 characters');
    admin = await prisma.user.create({ data: { email, name: process.env.BOOTSTRAP_ADMIN_NAME || 'UIT Administrator', passwordHash: await hashPassword(password) } });
    log(`created Super Admin ${email}`);
  }
  await prisma.userRole.createMany({ data: [{ userId: admin.id, roleId: superRole.id }], skipDuplicates: true });
  return admin;
}

async function seedMedia(adminId: string | null) {
  const manifest = JSON.parse(await fs.readFile(path.join(ASSET_DIR, 'manifest.json'), 'utf8')) as ManifestEntry[];
  let created = 0;
  for (const entry of manifest) {
    const existing = await prisma.mediaAsset.findFirst({ where: { originalFilename: entry.file } });
    if (existing) {
      media.set(entry.file, existing.id);
      continue;
    }
    const folderSlug = slugify(entry.folder);
    const folder = await prisma.mediaFolder.upsert({ where: { slug: folderSlug }, update: {}, create: { name: entry.folder, slug: folderSlug } });
    const buffer = await fs.readFile(path.join(ASSET_DIR, entry.file));
    const stored = await storeFile(buffer, entry.file.endsWith('.png') ? 'image/png' : 'image/jpeg');
    const asset = await prisma.mediaAsset.create({
      data: {
        ...stored,
        originalFilename: entry.file,
        altText: entry.alt,
        caption: entry.caption || null,
        description: `${entry.title}. Source: ${entry.source}`,
        category: entry.category,
        folderId: folder.id,
        uploadedById: adminId,
      },
    });
    for (const name of entry.tags) {
      const tag = await prisma.mediaTag.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
      await prisma.mediaAssetTag.create({ data: { assetId: asset.id, tagId: tag.id } });
    }
    media.set(entry.file, asset.id);
    created++;
  }
  log(`media: ${manifest.length} assets (${created} new, stored ${cloudinaryEnabled ? 'on Cloudinary' : 'on local disk'})`);
}

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    const data = SETTING_SCHEMAS[key as SettingKey].parse(resolveRefs(value)) as Prisma.InputJsonValue;
    const group = key.split('.')[1].replace(/^./, (c) => c.toUpperCase());
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value: data, group } });
  }
  for (const [i, c] of CONTACTS.entries()) {
    const exists = await prisma.contactInformation.findFirst({ where: { label: c.label } });
    if (!exists) await prisma.contactInformation.create({ data: { ...c, type: c.type as never, displayOrder: i } });
  }
  const approval = ARTICLES.find((a) => a.featured)!;
  if (!(await prisma.announcement.count())) {
    await prisma.announcement.create({
      data: {
        title: 'Establishment approved',
        message: 'The Ministry of Education approved the establishment of UIT on 19 April 2026. The Final Approval Certificate is pending; admissions have not opened.',
        url: `/news/${slugify(approval.title)}`,
        linkLabel: 'Read more',
        type: 'IMPORTANT',
        style: 'HIGHLIGHT',
        priority: 10,
        status: 'PUBLISHED',
      },
    });
  }
  log('settings, contacts and announcement');
}

async function seedAcademics() {
  let programs = 0;
  for (const [si, school] of SCHOOLS.entries()) {
    const faculty = await prisma.faculty.upsert({
      where: { name: school.name },
      update: {},
      create: {
        name: school.name, shortName: school.shortName, slug: slugify(school.name), description: school.description,
        imageId: img(school.image), displayOrder: si, status: 'PUBLISHED', needsVerification: true,
        verificationNote: 'School names follow the Academic Master Plan; the Concept Paper and campus signage use some different names.',
      },
    });
    for (const [di, dept] of school.departments.entries()) {
      const department = await prisma.department.upsert({
        where: { facultyId_name: { facultyId: faculty.id, name: dept.name } },
        update: {},
        create: { name: dept.name, slug: slugify(dept.name), facultyId: faculty.id, displayOrder: di, status: 'PUBLISHED' },
      });
      const list = [...dept.phase1.map((name) => ({ name, phase: 'PHASE_I' as const })), ...dept.phase2.map((name) => ({ name, phase: 'PHASE_II' as const }))];
      for (const [pi, p] of list.entries()) {
        const slug = slugify(p.name);
        if (await prisma.academicProgram.findUnique({ where: { slug } })) continue;
        await prisma.academicProgram.create({
          data: {
            name: p.name, slug, ...degreeOf(p.name), facultyId: faculty.id, departmentId: department.id,
            description: `Proposed ${p.phase === 'PHASE_I' ? 'Phase I (2027-2028)' : 'Phase II (2029-2030)'} program of the ${dept.name}, ${school.name}.`,
            programStatus: 'PROPOSED', launchPhase: p.phase, isVisible: true, displayOrder: di * 10 + pi,
          },
        });
        programs++;
      }
    }
  }
  log(`academics: ${SCHOOLS.length} schools, ${programs} new programs (all PROPOSED)`);
}

async function seedCentersAndResearch() {
  for (const [i, c] of CENTERS.entries()) {
    const { image, ...data } = c;
    await prisma.center.upsert({
      where: { name: c.name },
      update: {},
      create: { ...data, slug: slugify(c.name), imageId: img(image), displayOrder: i, status: 'PUBLISHED', sections: data.sections as Prisma.InputJsonValue },
    });
  }
  const cri = await prisma.center.findUniqueOrThrow({ where: { name: 'Center for Research & Innovation' } });
  if (!(await prisma.researchItem.count())) {
    const now = new Date();
    const areas = Object.entries(RESEARCH_AREAS).flatMap(([phase, titles]) =>
      titles.map((title, i) => ({
        title, slug: slugify(title), type: 'AREA' as const, phase: phase as 'PHASE_I' | 'PHASE_II', centerId: cri.id, displayOrder: i, status: 'PUBLISHED' as const, publishedAt: now,
        summary: phase === 'PHASE_I' ? 'Priority research area planned for Phase I (2026-2028).' : 'Advanced research area planned for Phase II (2029-2030).',
      })),
    );
    const initiatives = RESEARCH_INITIATIVES.map((r, i) => ({
      ...r, slug: slugify(r.title), type: 'INITIATIVE' as const, phase: 'PHASE_I' as const, centerId: cri.id, displayOrder: i, status: 'PUBLISHED' as const, publishedAt: now,
    }));
    await prisma.researchItem.createMany({ data: [...areas, ...initiatives] });
  }
  log(`centers: ${CENTERS.length}, research areas and initiatives`);
}

async function seedCampusAndGalleries() {
  for (const [i, item] of CAMPUS_ITEMS.entries()) {
    const slug = slugify(item.title);
    if (await prisma.campusItem.findUnique({ where: { slug } })) continue;
    const { image, ...data } = item;
    await prisma.campusItem.create({ data: { ...data, slug, category: data.category as never, developmentStatus: data.developmentStatus as never, imageId: img(image), displayOrder: i, status: 'PUBLISHED' } });
  }
  for (const [i, g] of GALLERIES.entries()) {
    let gallery = await prisma.gallery.findUnique({ where: { slug: g.slug } });
    if (!gallery) {
      gallery = await prisma.gallery.create({
        data: { slug: g.slug, title: g.title, description: g.description, category: g.category, coverImageId: img(g.cover), displayOrder: i, status: 'PUBLISHED', publishedAt: new Date() },
      });
      await prisma.galleryItem.createMany({ data: g.files.map((f, order) => ({ galleryId: gallery!.id, mediaId: img(f)!, displayOrder: order })) });
    }
    galleryIds.set(g.slug, gallery.id);
  }
  log(`campus items: ${CAMPUS_ITEMS.length}, galleries: ${GALLERIES.length}`);
}

async function seedPages(adminId: string | null) {
  let created = 0;
  for (const p of PAGES) {
    if (await prisma.page.findUnique({ where: { slug: p.slug } })) continue;
    const content = pageContentInput.parse(
      resolveRefs({
        title: p.title, slug: p.slug, eyebrow: p.eyebrow ?? null, summary: p.summary, template: p.template ?? 'standard',
        featuredImageId: p.featuredImage ? `@${p.featuredImage}` : null, seoDescription: p.seoDescription ?? null,
        needsVerification: p.needsVerification ?? false, verificationNote: p.verificationNote ?? null, blocks: p.blocks,
      }),
    );
    const { blocks, ...fields } = content;
    await prisma.page.create({
      data: {
        ...fields,
        status: p.status,
        publishedAt: p.status === 'PUBLISHED' ? new Date() : null,
        authorId: adminId,
        sections: {
          create: blocks.map((b, order) => ({
            type: b.type,
            order,
            data: (b.type === 'RICH_TEXT' ? { ...b.data, html: sanitizeRichText(String(b.data.html)) } : b.data) as Prisma.InputJsonValue,
          })),
        },
      },
    });
    created++;
  }
  log(`pages: ${PAGES.length} (${created} new)`);
}

/** Publishes the leadership page when an older draft is still in the database. Leaves a page that already has the Board portraits untouched. */
async function publishLeadership(adminId: string | null) {
  const seedPage = PAGES.find((p) => p.slug === 'about/leadership');
  if (!seedPage) return;
  const existing = await prisma.page.findUnique({ where: { slug: 'about/leadership' }, include: { sections: true } });
  const current = existing?.sections.some((section) => {
    const data = section.data as { variant?: string; title?: string };
    return data?.variant === 'people' && data.title === 'Board of Trustees';
  });
  if (existing && !current) {
    const content = pageContentInput.parse(
      resolveRefs({
        title: seedPage.title, slug: seedPage.slug, eyebrow: seedPage.eyebrow ?? null, summary: seedPage.summary,
        template: seedPage.template ?? 'standard', featuredImageId: null, seoDescription: seedPage.seoDescription ?? null,
        needsVerification: false, verificationNote: null, blocks: seedPage.blocks,
      }),
    );
    const { blocks, ...fields } = content;
    await prisma.$transaction(async (tx) => {
      await tx.page.update({
        where: { id: existing.id },
        data: {
          ...fields,
          status: 'PUBLISHED',
          publishedAt: existing.publishedAt ?? new Date(),
          draftData: Prisma.DbNull,
          hasDraftChanges: false,
          updatedById: adminId,
        },
      });
      await tx.pageSection.deleteMany({ where: { pageId: existing.id } });
      await tx.pageSection.createMany({
        data: blocks.map((b, order) => ({
          pageId: existing.id,
          type: b.type,
          order,
          data: (b.type === 'RICH_TEXT' ? { ...b.data, html: sanitizeRichText(String(b.data.html)) } : b.data) as Prisma.InputJsonValue,
        })),
      });
    });
    log('leadership: published Board, advisers and designated officers');
  }

  await prisma.navigationItem.updateMany({
    where: { url: '/about/leadership' },
    data: { isVisible: true, description: 'Board, advisers and academic officers' },
  });

  const footer = await prisma.navigationMenu.findUnique({ where: { key: 'footer-explore' } });
  if (footer && !(await prisma.navigationItem.findFirst({ where: { menuId: footer.id, url: '/about/leadership' } }))) {
    const page = await prisma.page.findUnique({ where: { slug: 'about/leadership' }, select: { id: true } });
    const count = await prisma.navigationItem.count({ where: { menuId: footer.id, parentId: null } });
    await prisma.navigationItem.create({
      data: { menuId: footer.id, label: 'Leadership', url: '/about/leadership', pageId: page?.id ?? null, displayOrder: count, isVisible: true },
    });
  }

  const about = await prisma.page.findUnique({ where: { slug: 'about' }, include: { sections: true } });
  const learn = about?.sections.find((section) => section.type === 'CARD_GRID' && (section.data as { title?: string }).title === 'Learn more');
  if (learn) {
    const data = learn.data as { cards?: { title?: string; url?: string; text?: string; badge?: string; imageId?: string | null }[]; columns?: number };
    if (!data.cards?.some((card) => card.url === '/about/leadership')) {
      const next = [...(data.cards ?? [])];
      const campusAt = next.findIndex((card) => card.url === '/campus');
      const card = { title: 'Leadership', text: 'The Board of Trustees, advisers and designated academic officers.', url: '/about/leadership', badge: '', imageId: null };
      if (campusAt >= 0) next.splice(campusAt, 0, card);
      else next.push(card);
      await prisma.pageSection.update({ where: { id: learn.id }, data: { data: { ...data, columns: 3, cards: next } as Prisma.InputJsonValue } });
      log('about: linked Leadership');
    }
  }
}

async function seedNews(adminId: string | null) {
  for (const c of NEWS_CATEGORIES) {
    await prisma.newsCategory.upsert({ where: { slug: slugify(c.name) }, update: {}, create: { ...c, slug: slugify(c.name) } });
  }
  const categories = new Map((await prisma.newsCategory.findMany()).map((c) => [c.name, c.id]));
  let created = 0;
  for (const a of ARTICLES) {
    const slug = slugify(a.title);
    if (await prisma.newsArticle.findUnique({ where: { slug } })) continue;
    await prisma.newsArticle.create({
      data: {
        title: a.title, slug, summary: a.summary, content: sanitizeRichText(paragraphs(a.paragraphs)),
        featuredImageId: img(a.image), categoryId: categories.get(a.category), authorId: adminId, isFeatured: Boolean(a.featured),
        status: a.date ? 'PUBLISHED' : 'DRAFT', publishedAt: a.date ? new Date(`${a.date}T09:00:00+06:00`) : null,
      },
    });
    created++;
  }
  log(`news: ${ARTICLES.length} articles (${created} new; undated items kept as drafts). No events seeded.`);
}

async function seedMenus() {
  type Item = (typeof MENUS)[number]['items'][number];
  for (const m of MENUS) {
    const existing = await prisma.navigationMenu.findUnique({ where: { key: m.key } });
    if (existing) continue;
    const menu = await prisma.navigationMenu.create({ data: { key: m.key, name: m.name, location: m.location } });
    const add = async (items: Item[], parentId: string | null) => {
      for (const [i, item] of items.entries()) {
        const page = await prisma.page.findUnique({ where: { slug: item.url.replace(/^\//, '') }, select: { id: true } });
        const created = await prisma.navigationItem.create({
          data: { menuId: menu.id, parentId, label: item.label, url: item.url, pageId: page?.id ?? null, description: item.description, displayOrder: i, isVisible: item.visible ?? true },
        });
        if (item.children) await add(item.children, created.id);
      }
    };
    await add(m.items, null);
  }
  log(`menus: ${MENUS.map((m) => m.key).join(', ')}`);
}

async function seedHomepage(adminId: string | null) {
  const home = await prisma.homepage.upsert({ where: { key: 'main' }, update: {}, create: { key: 'main' } });
  if (await prisma.homepageSection.count({ where: { homepageId: home.id } })) return log('homepage: already exists, left untouched');
  await prisma.$transaction(async (tx) => {
    for (const [order, s] of HOMEPAGE_SECTIONS.entries()) {
      const data = validateSectionData(s.type as HomepageSectionTypeKey, resolveRefs(s.data)) as Prisma.InputJsonValue;
      const variant = s.variant ?? 'default';
      await tx.homepageSection.create({
        data: {
          homepageId: home.id, type: s.type as HomepageSectionTypeKey, label: s.label,
          draftData: data, draftVariant: variant, draftOrder: order, draftEnabled: true,
          publishedData: data, publishedVariant: variant, publishedOrder: order, publishedEnabled: true, hasDraftChanges: false,
        },
      });
    }
    await tx.homepage.update({ where: { id: home.id }, data: { publishedAt: new Date(), publishedById: adminId } });
  });
  log(`homepage: ${HOMEPAGE_SECTIONS.length} sections published`);
}

async function main() {
  console.log('Seeding UIT database…');
  const admin = await seedAccess();
  const adminId = admin?.id ?? null;
  await seedMedia(adminId);
  await seedSettings();
  await seedAcademics();
  await seedCentersAndResearch();
  await seedCampusAndGalleries();
  await seedPages(adminId);
  await seedNews(adminId);
  await seedMenus();
  await publishLeadership(adminId);
  await seedHomepage(adminId);
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
