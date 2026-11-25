/** Manual end-to-end check against a running API: `npx tsx scripts/smoke.ts`. */
import 'dotenv/config';
import fs from 'node:fs/promises';

const base = process.env.BACKEND_URL ?? 'http://localhost:4000';
const origin = process.env.FRONTEND_URL?.split(',')[0] ?? 'http://localhost:5173';
let cookie = '';

async function call(method: string, url: string, body?: unknown, form?: FormData) {
  const res = await fetch(base + url, {
    method,
    headers: { Origin: origin, Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const set = res.headers.getSetCookie();
  if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
  const text = await res.text();
  let json: unknown = text;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  console.log(`${method} ${url} -> ${res.status}`);
  return { status: res.status, json: json as Record<string, any> };
}

const login = await call('POST', '/api/auth/login', { email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD });
console.log('  permissions:', login.json.user?.permissions?.length);
const dash = await call('GET', '/api/dashboard');
console.log('  dashboard:', JSON.stringify({ ...dash.json, recentActivity: undefined, recentlyEdited: undefined }));
const builder = await call('GET', '/api/homepage/builder');
console.log('  sections:', builder.json.sections?.length);

const form = new FormData();
const png = await fs.readFile('prisma/seed-assets/uit-logo.png');
form.append('files', new Blob([png], { type: 'image/png' }), 'smoke-test.png');
form.append('altText', 'Smoke test upload');
const up = await call('POST', '/api/media', undefined, form);
console.log('  uploaded:', up.json.items?.[0]?.id, up.json.errors);
if (up.json.items?.[0]) await call('DELETE', `/api/media/${up.json.items[0].id}`);

const fake = new FormData();
fake.append('files', new Blob([Buffer.from('not really an image')], { type: 'image/png' }), 'fake.png');
const bad = await call('POST', '/api/media', undefined, fake);
console.log('  fake image rejected:', bad.json.errors?.[0]?.message);

const csrf = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Origin: 'https://evil.example', Cookie: cookie } });
console.log('foreign origin logout ->', csrf.status);

await call('POST', '/api/auth/logout');
await call('GET', '/api/auth/me');
