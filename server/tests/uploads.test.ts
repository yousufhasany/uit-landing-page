import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Agent } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UPLOAD_DIR } from '../src/lib/storage.js';
import { anon, resetDatabase, signedIn } from './helpers.js';

const png = () => sharp({ create: { width: 1200, height: 800, channels: 3, background: '#0b5' } }).png().toBuffer();

describe('media uploads', () => {
  let manager: Agent;
  let contributor: Agent;

  beforeAll(async () => {
    expect(UPLOAD_DIR).not.toMatch(/storage[\\/]uploads$/);
    await resetDatabase();
    ({ agent: manager } = await signedIn('media_manager'));
    ({ agent: contributor } = await signedIn('content_contributor'));
  });

  afterAll(() => fs.rmSync(UPLOAD_DIR, { recursive: true, force: true }));

  it('stores an image with its metadata, serves it and deletes the files', async () => {
    const res = await manager.post('/api/media').field('altText', 'Test landscape').field('category', 'campus').attach('files', await png(), { filename: 'campus.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    const [asset] = res.body.items;
    expect(asset).toMatchObject({ type: 'IMAGE', width: 1200, height: 800, altText: 'Test landscape', provider: 'LOCAL', originalFilename: 'campus.png' });
    const { pathname } = new URL(asset.url);
    expect(pathname).toBe(`/uploads/${asset.publicId}`);

    const file = path.join(UPLOAD_DIR, asset.publicId);
    expect(fs.existsSync(file)).toBe(true);
    expect((await anon().get(pathname)).status).toBe(200);

    const updated = await manager.patch(`/api/media/${asset.id}`).send({ altText: 'Updated alt', tags: ['campus', 'aerial'] });
    expect(updated.status).toBe(200);
    expect(updated.body.altText).toBe('Updated alt');
    expect(updated.body.tags.sort()).toEqual(['aerial', 'campus']);

    expect((await manager.delete(`/api/media/${asset.id}`)).status).toBe(204);
    expect(fs.existsSync(file)).toBe(false);
    expect((await manager.get(`/api/media/${asset.id}`)).status).toBe(404);
  });

  it('rejects disallowed file types', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = await manager.post('/api/media').attach('files', svg, { filename: 'logo.svg', contentType: 'image/svg+xml' });
    expect(res.status).toBe(400);
    const html = await manager.post('/api/media').attach('files', Buffer.from('<html></html>'), { filename: 'x.html', contentType: 'text/html' });
    expect(html.status).toBe(400);
  });

  it('rejects files whose content does not match the declared type', async () => {
    const fakeImage = await manager.post('/api/media').attach('files', Buffer.from('definitely not a png'), { filename: 'fake.png', contentType: 'image/png' });
    expect(fakeImage.status).toBe(400);
    expect(fakeImage.body.errors[0].message).toMatch(/not a valid image/i);
    const fakePdf = await manager.post('/api/media').attach('files', Buffer.from('MZ executable'), { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(fakePdf.status).toBe(400);
  });

  it('requires a file', async () => {
    expect((await manager.post('/api/media').field('altText', 'nothing')).status).toBe(400);
  });

  it('accepts uploads from contributors but not deletion', async () => {
    const res = await contributor.post('/api/media').attach('files', await png(), { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    const id = res.body.items[0].id;
    expect((await contributor.delete(`/api/media/${id}`)).status).toBe(403);
    expect((await manager.delete(`/api/media/${id}`)).status).toBe(204);
  });

  it('refuses anonymous uploads', async () => {
    expect((await anon().post('/api/media').attach('files', await png(), { filename: 'a.png', contentType: 'image/png' })).status).toBe(401);
  });
});
