import type { Agent } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { anon, resetDatabase, signedIn } from './helpers.js';

describe('content CRUD', () => {
  let academic: Agent;
  let manager: Agent;

  beforeAll(async () => {
    await resetDatabase();
    ({ agent: academic } = await signedIn('academic_editor'));
    ({ agent: manager } = await signedIn('media_manager'));
  });

  describe('faculties, departments and programs', () => {
    let facultyId: string;
    let programId: string;

    it('creates records with generated unique slugs', async () => {
      const a = await academic.post('/api/faculties').send({ name: 'Faculty of Testing', status: 'PUBLISHED' });
      const b = await academic.post('/api/faculties').send({ name: 'Second Faculty', status: 'PUBLISHED', slug: 'faculty-of-testing' });
      expect([a.status, b.status]).toEqual([201, 201]);
      expect(a.body.slug).toBe('faculty-of-testing');
      expect(b.body.slug).toMatch(/^faculty-of-testing-/);
      facultyId = a.body.id;

      const duplicate = await academic.post('/api/faculties').send({ name: 'Faculty of Testing', slug: '' });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.message).toMatch(/already exists/);

      const dept = await academic.post('/api/departments').send({ name: 'Department of Checks', facultyId, status: 'PUBLISHED' });
      expect(dept.status).toBe(201);
      const program = await academic.post('/api/programs').send({ name: 'BSc in Testing', facultyId, departmentId: dept.body.id, degreeType: 'BSc', level: 'UNDERGRADUATE' });
      expect(program.status).toBe(201);
      expect(program.body.programStatus).toBe('PROPOSED');
      programId = program.body.id;
    });

    it('lists, filters and searches in the admin', async () => {
      const all = await academic.get('/api/programs/admin').query({ facultyId });
      expect(all.body.items).toHaveLength(1);
      expect((await academic.get('/api/programs/admin').query({ q: 'no-such-program' })).body.items).toHaveLength(0);
      expect((await academic.get(`/api/programs/admin/${programId}`)).body.name).toBe('BSc in Testing');
    });

    it('updates a record and persists display order', async () => {
      const updated = await academic.put(`/api/faculties/${facultyId}`).send({ name: 'Faculty of Testing', shortName: 'FT', status: 'PUBLISHED' });
      expect(updated.status).toBe(200);
      expect(updated.body.shortName).toBe('FT');
      expect(updated.body.slug).toBe('faculty-of-testing');

      const list = await academic.get('/api/faculties/admin');
      const ids = list.body.items.map((f: { id: string }) => f.id).reverse();
      expect((await academic.put('/api/faculties/order').send({ ids })).status).toBe(204);
      expect((await academic.get('/api/faculties/admin')).body.items.map((f: { id: string }) => f.id)).toEqual(ids);
    });

    it('refuses to delete a faculty that still has programs', async () => {
      expect((await academic.delete(`/api/faculties/${facultyId}`)).status).toBe(409);
      expect((await academic.delete(`/api/programs/${programId}`)).status).toBe(204);
    });

    it('validates input with field errors and rejects unknown ids', async () => {
      const bad = await academic.post('/api/programs').send({ name: 'X', degreeType: '', level: 'MAGIC' });
      expect(bad.status).toBe(422);
      expect(bad.body.error.fields).toHaveProperty('name');
      expect(bad.body.error.fields).toHaveProperty('facultyId');
      expect(bad.body.error.fields).toHaveProperty('level');
      expect((await academic.put('/api/faculties/not-a-uuid').send({ name: 'Whatever' })).status).toBe(422);
      expect((await academic.delete('/api/faculties/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    });
  });

  describe('site resources', () => {
    it('contacts and social links: create, hide, delete', async () => {
      const contact = await manager.post('/api/contacts').send({ label: 'Admissions office', type: 'EMAIL', value: 'admissions@example.edu', isVisible: true });
      expect(contact.status, JSON.stringify(contact.body)).toBe(201);
      const social = await manager.post('/api/social-links').send({ platform: 'website', label: 'Website', url: 'javascript:alert(1)' });
      expect(social.status).toBe(422);

      const publicIds = async () => (await anon().get('/api/contacts')).body.items.map((c: { id: string }) => c.id);
      expect(await publicIds()).toContain(contact.body.id);
      await manager.put(`/api/contacts/${contact.body.id}`).send({ label: 'Admissions office', type: 'EMAIL', value: 'admissions@example.edu', isVisible: false });
      expect(await publicIds()).not.toContain(contact.body.id);
      expect((await manager.delete(`/api/contacts/${contact.body.id}`)).status).toBe(204);
    });

    it('news categories: create, rename, delete', async () => {
      const cat = await manager.post('/api/news/categories').send({ name: 'Campus life' });
      expect(cat.status).toBe(201);
      expect((await manager.put(`/api/news/categories/${cat.body.id}`).send({ name: 'Student life' })).status).toBe(200);
      expect((await anon().get('/api/news/categories')).body.map((c: { name: string }) => c.name)).toContain('Student life');
      expect((await manager.delete(`/api/news/categories/${cat.body.id}`)).status).toBe(204);
    });

    it('gallery albums are only public once published', async () => {
      const album = await manager.post('/api/gallery').send({ title: 'Test album', status: 'DRAFT' });
      expect(album.status).toBe(201);
      expect((await anon().get(`/api/gallery/${album.body.slug}`)).status).toBe(404);
      await manager.put(`/api/gallery/${album.body.id}`).send({ title: 'Test album', status: 'PUBLISHED' });
      expect((await anon().get(`/api/gallery/${album.body.slug}`)).status).toBe(200);
      expect((await manager.delete(`/api/gallery/${album.body.id}`)).status).toBe(204);
    });
  });
});
