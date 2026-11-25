import type { Agent } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { anon, resetDatabase, signedIn } from './helpers.js';

const DAY = 86_400_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

describe('publishing workflow and public visibility', () => {
  let admin: Agent;

  beforeAll(async () => {
    await resetDatabase();
    ({ agent: admin } = await signedIn('media_manager'));
  });

  describe('pages', () => {
    let pageId: string;
    const slug = 'visibility-test';
    const content = (title: string, text: string) => ({ title, slug, template: 'standard', blocks: [{ type: 'HEADING', data: { text } }] });

    it('a new page is a draft and not public', async () => {
      const res = await admin.post('/api/pages').send(content('Visibility test', 'First version'));
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('DRAFT');
      pageId = res.body.id;
      expect((await anon().get('/api/pages/public').query({ slug })).status).toBe(404);
      expect((await anon().get(`/api/pages/admin/${pageId}/preview`)).status).toBe(401);
    });

    it('publishing makes it public', async () => {
      const res = await admin.post(`/api/pages/${pageId}/publish`).send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('PUBLISHED');
      const pub = await anon().get('/api/pages/public').query({ slug });
      expect(pub.status).toBe(200);
      expect(pub.body.blocks[0].data.text).toBe('First version');
    });

    it('draft edits to a live page stay private until published', async () => {
      const saved = await admin.put(`/api/pages/${pageId}`).send(content('Visibility test', 'Second version'));
      expect(saved.status).toBe(200);
      expect(saved.body.hasDraftChanges).toBe(true);
      expect((await anon().get('/api/pages/public').query({ slug })).body.blocks[0].data.text).toBe('First version');
      expect((await admin.get(`/api/pages/admin/${pageId}/preview`)).body.blocks[0].data.text).toBe('Second version');

      await admin.post(`/api/pages/${pageId}/publish`).send({});
      expect((await anon().get('/api/pages/public').query({ slug })).body.blocks[0].data.text).toBe('Second version');
    });

    it('discarding a draft restores the live content in the editor', async () => {
      await admin.put(`/api/pages/${pageId}`).send(content('Visibility test', 'Abandoned'));
      const discarded = await admin.post(`/api/pages/${pageId}/discard`);
      expect(discarded.body.hasDraftChanges).toBe(false);
      expect(discarded.body.content.blocks[0].data.text).toBe('Second version');
    });

    it('keeps a revision for each publish', async () => {
      const res = await admin.get(`/api/pages/admin/${pageId}`);
      expect(res.body.revisions.length).toBeGreaterThanOrEqual(2);
    });

    it('a scheduled page is hidden until its publish time', async () => {
      const res = await admin.post(`/api/pages/${pageId}/publish`).send({ publishedAt: iso(DAY) });
      expect(res.body.status).toBe('SCHEDULED');
      expect((await anon().get('/api/pages/public').query({ slug })).status).toBe(404);
      await prisma.page.update({ where: { id: pageId }, data: { publishedAt: new Date(Date.now() - 1000) } });
      expect((await anon().get('/api/pages/public').query({ slug })).status).toBe(200);
    });

    it('unpublishing and archiving remove it from the public site', async () => {
      await admin.post(`/api/pages/${pageId}/unpublish`);
      expect((await anon().get('/api/pages/public').query({ slug })).status).toBe(404);
      const archived = await admin.post(`/api/pages/${pageId}/archive`);
      expect(archived.body.status).toBe('ARCHIVED');
      expect((await anon().get('/api/pages/public').query({ slug })).status).toBe(404);
    });

    it('rejects invalid blocks with field-level errors', async () => {
      const res = await admin.put(`/api/pages/${pageId}`).send({ title: 'Visibility test', slug, blocks: [{ type: 'HEADING', data: { text: '' } }] });
      expect(res.status).toBe(422);
      expect(Object.keys(res.body.error.fields)).toContain('blocks.0.data.text');
    });

    it('strips scripts from rich text blocks', async () => {
      await admin.put(`/api/pages/${pageId}`).send({
        title: 'Visibility test',
        slug,
        blocks: [{ type: 'RICH_TEXT', data: { html: '<p>Safe</p><script>alert(1)</script><img src="x" onerror="alert(1)">' } }],
      });
      const page = await prisma.pageSection.findFirstOrThrow({ where: { pageId } });
      const html = String((page.data as { html: string }).html);
      expect(html).toContain('<p>Safe</p>');
      expect(html).not.toMatch(/<script|onerror/i);
    });
  });

  describe('news', () => {
    const article = { title: 'Campus update', summary: 'Summary of the update', content: '<p>Body</p><script>alert(1)</script>' };

    it('drafts are hidden from the public list and detail', async () => {
      const draft = await admin.post('/api/news').send({ ...article, status: 'DRAFT' });
      expect(draft.status).toBe(201);
      expect(draft.body.content).not.toMatch(/<script/);
      const list = await anon().get('/api/news');
      expect(list.body.items.map((n: { id: string }) => n.id)).not.toContain(draft.body.id);
      expect((await anon().get(`/api/news/${draft.body.slug}`)).status).toBe(404);

      await admin.post(`/api/news/${draft.body.id}/status`).send({ status: 'PUBLISHED' });
      expect((await anon().get(`/api/news/${draft.body.slug}`)).status).toBe(200);
    });

    it('a future publish date schedules the article instead of publishing it', async () => {
      const res = await admin.post('/api/news').send({ ...article, title: 'Scheduled notice', status: 'PUBLISHED', publishedAt: iso(2 * DAY) });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('SCHEDULED');
      expect((await anon().get(`/api/news/${res.body.slug}`)).status).toBe(404);
      await prisma.newsArticle.update({ where: { id: res.body.id }, data: { publishedAt: new Date(Date.now() - 1000) } });
      expect((await anon().get(`/api/news/${res.body.slug}`)).status).toBe(200);
    });

    it('scheduling requires a date', async () => {
      const res = await admin.post('/api/news').send({ ...article, title: 'No date', status: 'SCHEDULED' });
      expect(res.status).toBe(400);
    });

    it('validation errors name the offending fields', async () => {
      const res = await admin.post('/api/news').send({ title: 'x', summary: '' });
      expect(res.status).toBe(422);
      expect(res.body.error.fields).toHaveProperty('title');
      expect(res.body.error.fields).toHaveProperty('summary');
    });
  });

  describe('events', () => {
    it('separates upcoming and past published events and hides drafts', async () => {
      const upcoming = await admin.post('/api/events').send({ title: 'Upcoming test event', summary: 'S', startsAt: iso(7 * DAY), status: 'PUBLISHED' });
      const past = await admin.post('/api/events').send({ title: 'Past test event', summary: 'S', startsAt: iso(-7 * DAY), status: 'PUBLISHED' });
      const draft = await admin.post('/api/events').send({ title: 'Draft test event', summary: 'S', startsAt: iso(3 * DAY), status: 'DRAFT' });
      expect([upcoming.status, past.status, draft.status]).toEqual([201, 201, 201]);

      const ids = (res: { body: { items: { id: string }[] } }) => res.body.items.map((e) => e.id);
      const up = ids(await anon().get('/api/events').query({ when: 'upcoming' }));
      const old = ids(await anon().get('/api/events').query({ when: 'past' }));
      expect(up).toContain(upcoming.body.id);
      expect(up).not.toContain(past.body.id);
      expect(old).toContain(past.body.id);
      expect([...up, ...old]).not.toContain(draft.body.id);
    });

    it('rejects an end before the start', async () => {
      const res = await admin.post('/api/events').send({ title: 'Backwards event', summary: 'S', startsAt: iso(2 * DAY), endsAt: iso(DAY) });
      expect(res.status).toBe(422);
      expect(res.body.error.fields).toHaveProperty('endsAt');
    });
  });

  describe('homepage', () => {
    it('section edits stay in draft until the homepage is published', async () => {
      const added = await admin.post('/api/homepage/sections').send({ type: 'CTA' });
      expect(added.status).toBe(201);
      const id = added.body.id;
      expect((await admin.patch(`/api/homepage/sections/${id}`).send({ data: { title: 'Visit the campus' } })).status).toBe(200);
      expect((await anon().get('/api/homepage')).body.sections).toHaveLength(0);
      expect((await anon().get('/api/homepage/preview')).status).toBe(401);
      expect((await admin.get('/api/homepage/preview')).body.sections[0].data.title).toBe('Visit the campus');

      expect((await admin.post('/api/homepage/publish')).status).toBe(200);
      const live = await anon().get('/api/homepage');
      expect(live.body.sections[0].data.title).toBe('Visit the campus');

      await admin.patch(`/api/homepage/sections/${id}`).send({ data: { title: 'Unpublished wording' }, enabled: false });
      expect((await anon().get('/api/homepage')).body.sections[0].data.title).toBe('Visit the campus');
      await admin.post('/api/homepage/discard');
      const builder = await admin.get('/api/homepage/builder');
      const section = builder.body.sections.find((s: { id: string }) => s.id === id);
      expect(section.data.title).toBe('Visit the campus');
      expect(section.enabled).toBe(true);
    });

    it('rejects unsafe or invalid section data', async () => {
      const added = await admin.post('/api/homepage/sections').send({ type: 'HERO' });
      const res = await admin.patch(`/api/homepage/sections/${added.body.id}`).send({ data: { overlay: 500, buttons: [{ label: 'Go', url: 'javascript:alert(1)' }] } });
      expect(res.status).toBe(422);
    });
  });

  describe('academics and announcements', () => {
    it('program admission details are only public once a program is offered', async () => {
      const { agent: academic } = await signedIn('academic_editor');
      const f = await academic.post('/api/faculties').send({ name: 'Test Faculty', status: 'PUBLISHED' });
      expect(f.status).toBe(201);
      const program = await academic.post('/api/programs').send({
        name: 'Test Programme', facultyId: f.body.id, degreeType: 'BSc', level: 'UNDERGRADUATE', programStatus: 'PROPOSED', admissionInfo: '<p>Apply now</p>',
      });
      expect(program.status).toBe(201);

      const proposed = await anon().get(`/api/programs/${program.body.slug}`);
      expect(proposed.status).toBe(200);
      expect(proposed.body.isOffered).toBe(false);
      expect(proposed.body.admissionInfo).toBeNull();

      await academic.put(`/api/programs/${program.body.id}`).send({ ...program.body, featuredImage: undefined, programStatus: 'ACTIVE' });
      const active = await anon().get(`/api/programs/${program.body.slug}`);
      expect(active.body.isOffered).toBe(true);
      expect(active.body.admissionInfo).toContain('Apply now');

      await academic.put(`/api/programs/${program.body.id}`).send({ ...program.body, featuredImage: undefined, isVisible: false });
      expect((await anon().get(`/api/programs/${program.body.slug}`)).status).toBe(404);

      await academic.put(`/api/faculties/${f.body.id}`).send({ name: 'Test Faculty', status: 'DRAFT' });
      expect((await anon().get(`/api/faculties/${f.body.slug}`)).status).toBe(404);
    });

    it('announcements respect status, visibility and their display window', async () => {
      const make = (title: string, extra: Record<string, unknown>) => admin.post('/api/announcements').send({ title, message: 'Message text', status: 'PUBLISHED', ...extra });
      await make('Live notice', {});
      await make('Draft notice', { status: 'DRAFT' });
      await make('Hidden notice', { isVisible: false });
      await make('Future notice', { startsAt: iso(DAY) });
      await make('Expired notice', { startsAt: iso(-3 * DAY), endsAt: iso(-DAY) });
      const res = await anon().get('/api/announcements');
      expect(res.body.items.map((a: { title: string }) => a.title)).toEqual(['Live notice']);
      expect(res.body.items[0]).not.toHaveProperty('status');
    });
  });
});
