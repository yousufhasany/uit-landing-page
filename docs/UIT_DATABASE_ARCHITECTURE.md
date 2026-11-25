# UIT Website — Database Architecture

PostgreSQL is the only database. The schema is defined in `server/prisma/schema.prisma` and versioned with Prisma Migrate (`server/prisma/migrations`). The application connects through `@prisma/adapter-pg` using `DATABASE_URL`.

## 1. Conventions

- Primary keys are UUIDs (`@default(uuid())`). Every table has `createdAt` and most have `updatedAt`.
- Public URLs use unique `slug` columns. Slugs are generated from titles and de-duplicated with a numeric suffix.
- Content tables share `status ContentStatus` (`DRAFT | PUBLISHED | SCHEDULED | ARCHIVED`). Dated content also has `publishedAt`.
- `displayOrder` integers drive manual ordering, set by drag-and-drop in the CMS.
- `needsVerification` / `verificationNote` flag content that must be confirmed by the university before it is relied on. The CMS shows these as "Verify" badges and counts them on the dashboard.
- Foreign keys use `Restrict` where deletion would orphan meaningful content (for example a faculty with programs returns **409**), `SetNull` for optional media and author references, and `Cascade` for owned children (page sections, gallery items, menu items, role permissions).

## 2. Entity groups

### Identity and access
| Model | Notes |
|---|---|
| `User` | email (unique), bcrypt `passwordHash`, `isActive`, `lastLoginAt` |
| `Role` | `key` (unique), `isSystem` for built-in roles |
| `Permission` | `key` such as `news.publish`, grouped for the role editor |
| `UserRole`, `RolePermission` | Many-to-many joins |
| `RefreshToken` | SHA-256 hash of the refresh token, expiry, `revokedAt`, user agent and IP |
| `ActivityLog` | Who did what, to which entity, when and from which IP |

### Media
| Model | Notes |
|---|---|
| `MediaAsset` | provider (`CLOUDINARY`/`LOCAL`), `publicId` (unique), URLs, MIME type, kind, size, dimensions, duration, alt text, caption, category, folder, uploader. **Files are never stored in the database.** |
| `MediaFolder` | Nested folders |
| `MediaTag`, `MediaAssetTag` | Free tagging |

### Site structure and content
| Model | Notes |
|---|---|
| `Homepage` + `HomepageSection` | Each section stores both **draft** and **published** data, variant, order and enabled flag, so drafts never leak. `type` is one of 17 section types. |
| `Page` + `PageSection` | CMS pages built from typed blocks. `draftData` holds unpublished edits to live pages. |
| `ContentRevision` | JSON snapshots of pages and the homepage on publish (`entityType`, `entityId`, `version`) |
| `NewsArticle`, `NewsCategory`, `NewsTag`, `NewsArticleTag` | News, with featured flag and SEO fields |
| `Event`, `EventCategory` | `startsAt`/`endsAt`, venue, registration URL. Upcoming and past are computed from dates. |
| `Faculty` → `Department` → `AcademicProgram` | Programs carry `programStatus` (`PROPOSED`, `UNDER_DEVELOPMENT`, `APPROVED`, `ACTIVE`, `ARCHIVED`), `launchPhase` and `isVisible` |
| `Center`, `ResearchItem`, `CampusItem` | Centers with structured sections; research areas, projects and publications; campus facilities and development items with `developmentStatus` |
| `Gallery`, `GalleryItem` | Albums referencing media assets in order |
| `NavigationMenu`, `NavigationItem` | Header and footer menus; two-level tree; link to a CMS page or URL |
| `Announcement` | Type, style, priority, display window, auto-hide when expired |
| `SiteSetting` | Key/JSON settings (`site.identity`, `site.header`, `site.footer`, `site.seo`) |
| `SocialLink`, `ContactInformation` | Footer and contact page data |

## 3. Setting up a database

### Local development (no Docker required)
```bash
npm run db            # starts embedded PostgreSQL 17 on :5433 and creates the "uit" and "uit_test" databases
npm run db:migrate    # applies migrations to DATABASE_URL (prisma migrate dev)
npm run db:seed       # idempotent seed
```
Data persists in `server/.pgdata` (git-ignored). Any existing PostgreSQL 14+ server works too: point `DATABASE_URL` at it.

### Production
1. Provision managed PostgreSQL (for example Neon, RDS, Cloud SQL or Azure). Create a dedicated database user with rights only on the UIT database.
2. Set `DATABASE_URL` (with `sslmode=require` when the provider needs it).
3. Apply migrations **without** generating or resetting anything:
   ```bash
   npm run db:deploy -w server     # prisma migrate deploy
   ```
4. Run the seed once to create permissions, roles, the bootstrap Super Admin and the verified starting content:
   ```bash
   npm run db:seed
   ```

> Never run `prisma migrate reset`, `prisma db push --force-reset` or `prisma migrate dev` against production. `migrate dev` may offer to reset the database when it detects drift.

## 4. Migrations workflow

1. Edit `schema.prisma`.
2. `npm run db:migrate -- --name describe_change` (development only) creates a new SQL migration and applies it locally.
3. Review the generated SQL in `prisma/migrations/<timestamp>_describe_change/migration.sql` and commit it.
4. Deploy with `prisma migrate deploy`.

For destructive changes (dropping or renaming columns), use expand-and-contract: add the new column, backfill, deploy code that uses it, then remove the old column in a later migration.

## 5. Seed

`server/prisma/seed.ts` is **idempotent**: it upserts permissions and built-in roles, and inserts only records that don't exist yet (matched by slug or key). Edits made in the CMS are never overwritten. Specifically:

- **Permissions and roles:** new permissions are added. The Super Admin role always receives every permission. Other built-in roles keep any customisation made in the CMS.
- **Bootstrap Super Admin:** created from `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` if no user has that email. No credentials are hard-coded. If the variables are empty, no administrator is created.
- **Media:** university photographs from `server/prisma/seed-assets` (curated from `source-materials/`) are uploaded through the normal storage pipeline (Cloudinary or local).
- **Content:** verified content from the source documents (see `UIT_SOURCE_ANALYSIS.md`). Uncertain items are saved as drafts or flagged `needsVerification`. News articles are created only for dated, documented milestones; undated items stay drafts. **No events are seeded.**
- **Homepage:** created and published only if it has no sections yet.

## 6. Backups and restore

Managed providers offer automated backups and point-in-time recovery; enable them. In addition, take logical backups before every deployment that includes a migration:

```bash
# Backup (custom format, compressed)
pg_dump --format=custom --no-owner --file=uit-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"

# Restore into an EMPTY database (never over the live one)
createdb uit_restore
pg_restore --no-owner --dbname=postgresql://USER:PASS@HOST:5432/uit_restore uit-20260101-0900.dump
```

Media files live in Cloudinary (or `UPLOAD_DIR` locally), so back those up separately: Cloudinary has backup settings, or copy the upload directory. Restoring the database without the media keeps metadata whose files are missing.

Test restores periodically into a scratch database.

## 7. Test database

`TEST_DATABASE_URL` must point at a database whose name ends in `_test`. The test suite refuses to run otherwise. Migrations are applied once per run. Each test file then truncates all tables and recreates permissions and roles. Test users are created by the tests themselves, with a throwaway password that exists only in the test database.
