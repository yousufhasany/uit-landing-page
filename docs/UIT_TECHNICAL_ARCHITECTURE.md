# UIT Website — Technical Architecture

## 1. Overview

An npm-workspaces monorepo with two packages:

| Package | Stack | Purpose |
|---|---|---|
| `client/` | React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7 (data router), TanStack Query 5, Framer Motion, Lucide, React Hook Form + Zod, TipTap 3, dnd-kit, sonner | Public website and the `/admin` CMS (code-split; admin bundles load only for signed-in users) |
| `server/` | Node 20+, Express 5, TypeScript, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, Zod 4, bcrypt, JWT, multer, sharp, Cloudinary SDK, sanitize-html | REST API, authentication, RBAC, media pipeline, sitemap/robots |

The browser never talks to Cloudinary or the database directly. Every write goes through the API, which enforces permissions.

```
Browser ──► /api/*  (Express) ──► Prisma ──► PostgreSQL
        ──► /uploads/* (local dev media)      └─► Cloudinary (production media)
        ──► /sitemap.xml, /robots.txt
```

In development, Vite serves the client on :5173 and proxies `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to the API on :4000, so cookies are first-party. In production, serve both from the same origin: a reverse proxy routes `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to Express, and everything else to the static `client/dist` with SPA fallback to `index.html`.

## 2. Server layout (`server/src`)

| Folder | Responsibility |
|---|---|
| `config/` | `env.ts` (validated environment; the process exits on invalid config), `permissions.ts` (permission catalogue and built-in roles) |
| `routes/` | Route table with a permission guard on every admin endpoint, plus the login and upload rate limiters |
| `controllers/` | Thin HTTP adapters: parse input with Zod, call the service, shape the response |
| `services/` | Business rules: publishing, drafts, revisions, user and role safety rules, media, homepage builder |
| `repositories/` | Reusable Prisma queries (users, media, tokens) |
| `validators/` | Zod schemas for homepage sections, page blocks, news, events and media |
| `middleware/` | `authenticate` (reads the access cookie), `requirePermission`, `verifyOrigin`, error handler |
| `lib/` | Prisma client, storage (Cloudinary or local), HTML sanitizer, friendly Zod messages |
| `utils/` | HTTP errors, tokens and cookies, slugs, pagination, publication rules, media DTOs |

Request pipeline (`app.ts`): `helmet` → `cors` (only `FRONTEND_URL` origins, credentials) → compression → JSON body (2 MB) → cookies → static `/uploads` → sitemap/robots → `/api`: general rate limit → `verifyOrigin` → `authenticate` → `Cache-Control: no-store` → routes → 404 → error handler.

### Error format
All errors are `{ "error": { "message": string, "fields"?: { "path.to.field": "message" } } }`. Validation errors return **422** with field paths matching the form fields (for example `blocks.2.data.text`). Unique conflicts return 409, missing records 404, and permission failures 403. In production, unexpected errors return a generic message without stack traces.

## 3. Authentication

- `POST /api/auth/login` verifies a bcrypt hash (cost 12) and issues two **HttpOnly** cookies that are `Secure` in production. They are `SameSite=Lax` by default; `COOKIE_SAME_SITE=none` exists only for a frontend and API on unrelated domains:
  - `uit_at`: a short-lived access JWT (default 15 min), path `/`.
  - `uit_rt`: an opaque refresh token (default 7 days), path `/api/auth`. Only its SHA-256 hash is stored, in `RefreshToken`.
- `POST /api/auth/refresh` **rotates** the refresh token. Reusing a revoked token revokes the user's whole token family.
- Logout revokes the token. Deactivating a user revokes all of their tokens.
- Tokens are never placed in JSON responses or `localStorage`. The client learns who is signed in from `GET /api/auth/me`.
- Login and password change are rate-limited (10 per 15 minutes per IP). Login failures use one generic message, so the response doesn't reveal which accounts exist.
- CSRF defence: SameSite cookies plus `verifyOrigin`, which rejects state-changing requests whose `Origin` header is not an allowed frontend origin.

## 4. Authorization (RBAC)

Permissions are fine-grained keys (`news.publish`, `media.delete`, `users.manage`…) stored in `Permission` and granted to roles through `RolePermission`. A user's effective permissions are loaded on every request. **Every admin route is guarded on the server**; the admin UI hides what a user can't do only for convenience.

Built-in roles: **Super Admin** (every permission), **Media Manager**, **Editor**, **News Editor**, **Academic Editor**, **Content Contributor**. They are editable in the CMS, except Super Admin.

Safety rules in `users.service.ts`:
- Only a Super Admin can create, modify, reset the password of, or delete a Super Admin, or assign the Super Admin role.
- Nobody can deactivate or delete their own account.
- The last active Super Admin can't be demoted, deactivated or deleted.
- A role editor can only grant permissions they hold themselves. The Super Admin role can't be edited, and built-in roles can't be deleted.

**Media Manager** holds the content permissions (homepage, pages, news, events, media, gallery, navigation, announcements, centers, research, campus, contacts, social) but **not** `users.manage`, `roles.manage`, `settings.manage`, `security.manage` or `logs.view`. Secrets live only in environment variables and are never exposed through the API, so no role can read them.

Publishing rule (`assertPublishRights`): without the module's `*.publish` permission, a user can create and edit drafts. They can't create published or scheduled items, edit live items or change their status.

## 5. Content lifecycle

| Status | Public? |
|---|---|
| `DRAFT` | No |
| `SCHEDULED` | From `publishedAt` onwards. This is evaluated per request, so no background job is needed. |
| `PUBLISHED` | Yes. A future date automatically becomes `SCHEDULED`. |
| `ARCHIVED` | No |

- **Pages:** saving a live page stores the edit as a working copy (`draftData`, `hasDraftChanges`). The public page doesn't change until **Publish**. Each publish writes a `ContentRevision`; restoring a revision loads it into the working copy, never directly onto the live page.
- **Homepage:** each section has separate draft and published columns (data, variant, order, enabled). *Publish* copies draft to published in one transaction and records a revision. *Discard* reverts the draft.
- **Programs:** carry an academic status (Proposed, Under development, Approved, Currently offered, Archived). Admission details are only returned publicly when the status is `ACTIVE`.
- **Announcements:** visible only when published, visible, and inside their display window.

Rich text (TipTap output, program text, `RICH_TEXT` blocks) is sanitized on the server with an allow-list. Scripts, event handlers and `javascript:` URLs are removed. Link fields accept only `http(s)`, `mailto:`, `tel:` or site-relative URLs.

## 6. Media pipeline

1. The browser uploads with `multipart/form-data` to `POST /api/media`. This needs `media.upload` and is rate-limited.
2. The server checks the declared MIME type against an allow-list (JPG, PNG, WebP, GIF, AVIF, MP4, WebM, PDF; **no SVG**), enforces size limits (`MAX_IMAGE_MB`, `MAX_VIDEO_MB`), and **verifies the content**. Images must decode with sharp; PDF, MP4 and WebM are checked by file signature.
3. Storage:
   - **Cloudinary** when its credentials are configured. This is required when `NODE_ENV=production`, and the API refuses to start without it.
   - **Local disk** (`server/storage/uploads`, or `UPLOAD_DIR`) for development, with WebP responsive variants generated by sharp.
4. PostgreSQL stores only metadata: provider, public ID, URLs, dimensions, size, alt text, caption, folder and tags. Replacing a file keeps the same record, so every reference updates automatically.

The client renders images with `srcset`. Cloudinary URLs use `f_auto,q_auto` transformations.

## 7. Client architecture (`client/src`)

- `routes.tsx`: public routes under `PublicLayout`, with dedicated pages for academics, centers, research, gallery, news and events. A catch-all `CmsPage` resolves any other path to a CMS page by slug, so new pages need no code. Short aliases (`/programs`, `/gallery`, `/vision-mission`…) redirect to the canonical nested URLs.
- `components/home/`: one component per homepage section type and layout variant.
- `components/blocks/`: page block renderers.
- `admin/`: AuthProvider, a permission-aware layout and sidebar, `RequireAuth` guards, a schema-driven form system (`SchemaForm`, `sectionFields`, `blockFields`, `resourceConfigs`), the media picker and library, and module screens.
- Data: TanStack Query, with `credentials: 'include'`. A 401 triggers one silent `/auth/refresh` and a retry.
- SEO: per-page title, description, canonical and Open Graph tags from CMS fields and site defaults; the API generates `sitemap.xml` from published content; `robots.txt` disallows `/admin`.
- Accessibility: semantic landmarks, a skip link, visible focus rings, alt text from the media library, keyboard-operable menus, dialogs and drag handles, and `prefers-reduced-motion` support.

## 8. Security checklist

| Concern | Measure |
|---|---|
| Secrets | Only in `server/.env` (git-ignored). The client gets only `VITE_*` public values. JWT secrets must be at least 32 characters, and the two must differ in production. |
| Passwords | bcrypt. Policy: at least 10 characters, with upper and lower case letters and a number. Hashes are never serialized. |
| Sessions | HttpOnly cookies, rotation, revocation on logout or deactivation |
| CSRF | SameSite cookies + Origin verification |
| XSS | Server-side HTML sanitization; React escaping; no SVG uploads |
| Injection | Prisma parameterized queries; Zod validation on every input |
| Abuse | Global, login and upload rate limits; JSON body limit; upload size limits |
| Headers | helmet (HSTS in production, no `X-Powered-By`, safe referrer policy) |
| Audit | `ActivityLog` records every create, update, publish, delete and sign-in, with user, IP and summary |
| Data safety | Tests refuse to run unless the database name ends in `_test`. The seed only inserts missing records and never resets data. |
