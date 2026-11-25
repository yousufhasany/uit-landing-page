import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../src/utils/tokens.js';
import { anon, app, createUser, ORIGIN, PASSWORD, resetDatabase } from './helpers.js';

const cookieNames = (res: request.Response) => ([] as string[]).concat(res.headers['set-cookie'] ?? []).map((c) => c.split('=')[0]);

describe('authentication', () => {
  let email: string;
  beforeAll(async () => {
    await resetDatabase();
    email = (await createUser('editor')).email;
  });

  it('signs in with valid credentials and sets HttpOnly cookies only', async () => {
    const res = await anon().post('/api/auth/login').set('Origin', ORIGIN).send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.permissions).toContain('pages.edit');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|token/i);
    const cookies = ([] as string[]).concat(res.headers['set-cookie']);
    expect(cookies.length).toBeGreaterThanOrEqual(2);
    for (const c of cookies) expect(c).toMatch(/HttpOnly/i);
  });

  it('rejects a wrong password with a generic message', async () => {
    const res = await anon().post('/api/auth/login').send({ email, password: 'Wrong-passw0rd' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('gives the same answer for an unknown email', async () => {
    const res = await anon().post('/api/auth/login').send({ email: 'nobody@test.local', password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('refuses deactivated accounts', async () => {
    const inactive = await createUser('editor', { isActive: false });
    const res = await anon().post('/api/auth/login').send({ email: inactive.email, password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('requires a session for /me and protected endpoints', async () => {
    expect((await anon().get('/api/auth/me')).status).toBe(401);
    expect((await anon().get('/api/pages/admin')).status).toBe(401);
    expect((await anon().get('/api/users')).status).toBe(401);
  });

  it('rotates the refresh token and rejects reuse of the old one', async () => {
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    const oldRefresh = ([] as string[]).concat(login.headers['set-cookie']).find((c) => c.startsWith(`${REFRESH_COOKIE}=`))!.split(';')[0];

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    expect(cookieNames(refreshed)).toEqual(expect.arrayContaining([ACCESS_COOKIE, REFRESH_COOKIE]));

    const replay = await anon().post('/api/auth/refresh').set('Cookie', oldRefresh);
    expect(replay.status).toBe(401);
  });

  it('logs out and revokes the session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await agent.post('/api/auth/refresh')).status).toBe(401);
  });

  it('enforces the password policy when changing passwords', async () => {
    const user = await createUser('editor');
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    const weak = await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'short' });
    expect(weak.status).toBe(422);
    const wrong = await agent.post('/api/auth/change-password').send({ currentPassword: 'Not-the-passw0rd', newPassword: 'Another-Passw0rd' });
    expect(wrong.status).toBe(400);
    const ok = await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'Another-Passw0rd' });
    expect(ok.status).toBe(204);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toContain('Another');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects state-changing requests from a foreign origin', async () => {
    const res = await anon().post('/api/auth/login').set('Origin', 'https://evil.example').send({ email, password: PASSWORD });
    expect(res.status).toBe(403);
  });
});
