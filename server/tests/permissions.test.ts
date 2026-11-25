import type { Agent } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { anon, createRole, createUser, PASSWORD, resetDatabase, signedIn } from './helpers.js';

const draftNews = { title: 'Draft article for review', summary: 'Summary', content: '<p>Body</p>', status: 'DRAFT' };

describe('role-based access control', () => {
  let superAdmin: Agent;
  let superAdminId: string;
  let mediaManager: Agent;
  let contributor: Agent;
  let editor: Agent;
  let superRoleId: string;
  let editorRoleId: string;

  beforeAll(async () => {
    await resetDatabase();
    ({ agent: superAdmin, user: { id: superAdminId } } = await signedIn('super_admin'));
    ({ agent: mediaManager } = await signedIn('media_manager'));
    ({ agent: contributor } = await signedIn('content_contributor'));
    ({ agent: editor } = await signedIn('editor'));
    superRoleId = (await prisma.role.findUniqueOrThrow({ where: { key: 'super_admin' } })).id;
    editorRoleId = (await prisma.role.findUniqueOrThrow({ where: { key: 'editor' } })).id;
  });

  it('anonymous visitors cannot reach any admin endpoint', async () => {
    for (const path of ['/api/dashboard', '/api/homepage/builder', '/api/news/admin', '/api/pages/admin', '/api/media', '/api/settings', '/api/roles', '/api/users', '/api/activity-logs', '/api/programs/admin']) {
      expect((await anon().get(path)).status, path).toBe(401);
    }
    expect((await anon().post('/api/news').send(draftNews)).status).toBe(401);
  });

  describe('Media Manager', () => {
    it('manages content modules, including publishing', async () => {
      expect((await mediaManager.get('/api/homepage/builder')).status).toBe(200);
      expect((await mediaManager.get('/api/media')).status).toBe(200);
      expect((await mediaManager.get('/api/menus')).status).toBe(200);
      expect((await mediaManager.post('/api/news').send({ ...draftNews, status: 'PUBLISHED' })).status).toBe(201);
    });

    it('cannot manage users, roles, settings or activity logs', async () => {
      expect((await mediaManager.get('/api/users')).status).toBe(403);
      expect((await mediaManager.post('/api/users').send({ name: 'Sneaky', email: 'x@test.local', password: PASSWORD, roleIds: [superRoleId] })).status).toBe(403);
      expect((await mediaManager.get('/api/roles')).status).toBe(403);
      expect((await mediaManager.post('/api/roles').send({ name: 'Sneaky', permissions: ['users.manage'] })).status).toBe(403);
      expect((await mediaManager.put(`/api/roles/${editorRoleId}`).send({ name: 'Editor', permissions: ['users.manage'] })).status).toBe(403);
      expect((await mediaManager.get('/api/settings')).status).toBe(403);
      expect((await mediaManager.put('/api/settings/site.identity').send({ name: 'Hacked' })).status).toBe(403);
      expect((await mediaManager.get('/api/activity-logs')).status).toBe(403);
    });

    it('can view but not change the academic structure', async () => {
      expect((await mediaManager.get('/api/programs/admin')).status).toBe(200);
      expect((await mediaManager.post('/api/faculties').send({ name: 'Unauthorised School' })).status).toBe(403);
    });
  });

  describe('Content Contributor', () => {
    it('can save drafts but not publish or delete', async () => {
      const draft = await contributor.post('/api/news').send(draftNews);
      expect(draft.status).toBe(201);
      expect((await contributor.post('/api/news').send({ ...draftNews, status: 'PUBLISHED' })).status).toBe(403);
      expect((await contributor.post(`/api/news/${draft.body.id}/status`).send({ status: 'PUBLISHED' })).status).toBe(403);
      expect((await contributor.delete(`/api/news/${draft.body.id}`)).status).toBe(403);
    });

    it('cannot change a live article', async () => {
      const live = await superAdmin.post('/api/news').send({ ...draftNews, title: 'Live article', status: 'PUBLISHED' });
      expect(live.status).toBe(201);
      const res = await contributor.put(`/api/news/${live.body.id}`).send({ ...draftNews, title: 'Defaced', status: 'PUBLISHED' });
      expect(res.status).toBe(403);
      expect((await prisma.newsArticle.findUniqueOrThrow({ where: { id: live.body.id } })).title).toBe('Live article');
    });

    it('can draft page changes but not publish pages or the homepage', async () => {
      const page = await superAdmin.post('/api/pages').send({ title: 'Contributor test page' });
      expect(page.status).toBe(201);
      expect((await contributor.put(`/api/pages/${page.body.id}`).send({ ...page.body.content, title: 'Edited draft' })).status).toBe(200);
      expect((await contributor.post(`/api/pages/${page.body.id}/publish`).send({})).status).toBe(403);
      expect((await contributor.get('/api/homepage/builder')).status).toBe(403);
      expect((await contributor.post('/api/homepage/publish')).status).toBe(403);
    });
  });

  it('Editors cannot manage navigation, delete media or manage users', async () => {
    expect((await editor.get('/api/menus')).status).toBe(403);
    expect((await editor.delete('/api/media/00000000-0000-4000-8000-000000000000')).status).toBe(403);
    expect((await editor.get('/api/users')).status).toBe(403);
    expect((await editor.post('/api/homepage/publish')).status).toBe(403);
  });

  describe('Super Admin protection', () => {
    it('only a Super Admin can create, modify, reset or delete Super Admins', async () => {
      const otherSuper = await createUser('super_admin');
      await createRole('user_admin', ['users.manage']);
      const { agent: userAdmin } = await signedIn('user_admin');

      expect((await userAdmin.get('/api/users')).status).toBe(200);
      expect((await userAdmin.post('/api/users').send({ name: 'New Super', email: 'newsuper@test.local', password: PASSWORD, roleIds: [superRoleId] })).status).toBe(403);
      expect((await userAdmin.put(`/api/users/${otherSuper.id}`).send({ isActive: false })).status).toBe(403);
      expect((await userAdmin.post(`/api/users/${otherSuper.id}/password`).send({ password: 'Takeover-Passw0rd' })).status).toBe(403);
      expect((await userAdmin.delete(`/api/users/${otherSuper.id}`)).status).toBe(403);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: otherSuper.id } })).isActive).toBe(true);

      const created = await userAdmin.post('/api/users').send({ name: 'New Editor', email: 'neweditor@test.local', password: PASSWORD, roleIds: [editorRoleId] });
      expect(created.status).toBe(201);
      expect(JSON.stringify(created.body)).not.toMatch(/passwordHash/);
      expect((await userAdmin.put(`/api/users/${created.body.id}`).send({ roleIds: [superRoleId] })).status).toBe(403);
    });

    it('a Super Admin cannot delete or deactivate themselves, or remove the last Super Admin', async () => {
      await prisma.userRole.deleteMany({ where: { role: { key: 'super_admin' }, userId: { not: superAdminId } } });
      expect((await superAdmin.delete(`/api/users/${superAdminId}`)).status).toBe(400);
      expect((await superAdmin.put(`/api/users/${superAdminId}`).send({ isActive: false })).status).toBe(400);
      expect((await superAdmin.put(`/api/users/${superAdminId}`).send({ roleIds: [editorRoleId] })).status).toBe(400);
    });

    it('the Super Admin role cannot be edited and built-in roles cannot be deleted', async () => {
      expect((await superAdmin.put(`/api/roles/${superRoleId}`).send({ name: 'Super Admin', permissions: [] })).status).toBe(403);
      expect((await superAdmin.delete(`/api/roles/${superRoleId}`)).status).toBe(403);
      expect((await superAdmin.delete(`/api/roles/${editorRoleId}`)).status).toBe(403);
    });
  });

  it('nobody can grant permissions they do not hold', async () => {
    await createRole('role_manager', ['roles.manage']);
    const { agent } = await signedIn('role_manager');
    expect((await agent.post('/api/roles').send({ name: 'Escalation', permissions: ['security.manage'] })).status).toBe(403);
    expect((await agent.put(`/api/roles/${editorRoleId}`).send({ name: 'Editor', permissions: ['users.manage'] })).status).toBe(403);
    expect((await agent.post('/api/roles').send({ name: 'Harmless', permissions: ['roles.manage'] })).status).toBe(201);
  });

  it('records administrative actions in the activity log', async () => {
    const logs = await superAdmin.get('/api/activity-logs');
    expect(logs.status).toBe(200);
    const entries = JSON.stringify(logs.body);
    expect(entries).toMatch(/Live article/);
    expect(entries).not.toMatch(/passwordHash|Test-Passw0rd/);
  });
});
