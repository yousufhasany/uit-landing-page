# UIT Website — Implementation Plan and Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Source analysis (`UIT_SOURCE_ANALYSIS.md`), curated image library (`server/prisma/seed-assets`, originals left untouched in `source-materials/`) | Done |
| 2 | Design system: UIT teal and gold palette, typography, layout primitives, motion with reduced-motion support | Done |
| 3 | Public website: CMS-driven homepage, dynamic CMS pages, academics, centers, research, campus, gallery, news, events, search, SEO, 404 | Done |
| 4 | Monorepo, Prisma schema, migrations, embedded PostgreSQL for development | Done |
| 5 | Express API: modules, validation, error format, sanitization, rate limits, sitemap/robots | Done |
| 6 | Authentication (HttpOnly JWT cookies with rotation) and RBAC with server-enforced permissions | Done |
| 7 | Admin shell: sign-in, permission-filtered sidebar, dashboard with live counts, account and password | Done |
| 8 | Homepage builder: drag-and-drop ordering, show/hide, layout variants, draft, preview, publish, discard, revision history | Done |
| 9 | Media library: upload (Cloudinary or local), content verification, folders, tags, replace, usage, picker | Done |
| 10 | Content modules: pages (block editor, drafts on live pages, scheduling, revisions), news, events, academics, centers, research, campus, gallery, navigation, announcements, settings, social, contacts, users, roles, activity log | Done |
| 11 | Idempotent seed with verified content and verification flags | Done |
| 12 | Automated tests (55): auth, RBAC and Super Admin protections, CRUD, publishing and visibility, uploads | Done |
| 13 | Browser QA (desktop and mobile), documentation, environment templates | Done |

## Verification performed

- `npm run typecheck` (server and client) passes.
- `npm test`: 55 API tests pass against an isolated `uit_test` database.
- Browser checks: every admin screen loads without console errors at 1440 px, and key screens have no horizontal overflow at 390 px. Round-trips were exercised in the browser: homepage draft, preview and discard; page and news drafts staying private; resource create and delete; gallery ordering; menu editing.

## Recommended next steps (outside this build)

1. **Content verification:** work through the items in `UIT_WEBSITE_CONTENT_PLAN.md` §4 with the university, then publish the Leadership page.
2. **Production hosting:** managed PostgreSQL, Cloudinary account, HTTPS on a single origin (or same site) for the site and API, automated database backups.
3. **Monitoring:** uptime checks on `/api/health`, and error reporting for the API.
4. **Optional enhancements:** an email notification when a contributor submits a draft for review; a public contact form with spam protection, once an official inbox exists; Bengali translations.
