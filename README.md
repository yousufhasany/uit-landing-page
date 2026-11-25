# University of Integrated Thought (UIT): Website and CMS

The official website of the University of Integrated Thought, Bangladesh, with a built-in content management system at `/admin`.

- **Public site:** React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Framer Motion.
- **API and CMS backend:** Express, TypeScript, Prisma, **PostgreSQL**, JWT in HttpOnly cookies, role-based permissions, Cloudinary media.

Documentation lives in [`docs/`](docs):

| Document | Contents |
|---|---|
| [UIT_SOURCE_ANALYSIS.md](docs/UIT_SOURCE_ANALYSIS.md) | What the supplied materials say, conflicts between them, and what needs verification |
| [UIT_WEBSITE_CONTENT_PLAN.md](docs/UIT_WEBSITE_CONTENT_PLAN.md) | Site map, sources per page, editorial rules |
| [UIT_TECHNICAL_ARCHITECTURE.md](docs/UIT_TECHNICAL_ARCHITECTURE.md) | Architecture, auth, permissions, publishing, media, security |
| [UIT_DATABASE_ARCHITECTURE.md](docs/UIT_DATABASE_ARCHITECTURE.md) | Schema, migrations, seed, backups |
| [UIT_IMPLEMENTATION_PLAN.md](docs/UIT_IMPLEMENTATION_PLAN.md) | Phases, status, next steps |

## Requirements

- Node.js 20.19 or newer (22 LTS recommended) and npm 10+
- No database install is needed for development: an embedded PostgreSQL 17 is included. Any PostgreSQL 14+ also works.

## Getting started (development)

```bash
# 1. Install dependencies (both workspaces)
npm install

# 2. Configure the API
cp server/.env.example server/.env      # PowerShell: Copy-Item server/.env.example server/.env
```

Edit `server/.env`:
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: two different random strings of 32+ characters. Generate them with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`: the first Super Admin account. The password needs 10+ characters with upper and lower case letters and a number.
- Leave the `CLOUDINARY_*` values empty to store uploads on local disk during development.

```bash
# 3. Start PostgreSQL (keep this terminal open)
npm run db

# 4. In a second terminal: create the schema and load the verified starting content
npm run setup            # = prisma migrate dev + seed

# 5. Run the API (:4000) and the site (:5173)
npm run dev
```

Open http://localhost:5173 for the website and http://localhost:5173/admin to sign in with the bootstrap credentials from `server/.env`. Change the password after the first sign-in (*Account* in the admin menu).

The seed can be re-run at any time (`npm run db:seed`). It only adds missing records and never overwrites CMS edits.

## Scripts

| Command | What it does |
|---|---|
| `npm run db` | Start the embedded development PostgreSQL on port 5433 (databases `uit` and `uit_test`) |
| `npm run dev` | API with hot reload + Vite dev server |
| `npm run setup` | Apply migrations and seed |
| `npm run db:migrate` | Create or apply development migrations (`prisma migrate dev`) |
| `npm run db:seed` | Idempotent seed |
| `npm test` | API test suite (requires `npm run db` running; uses `TEST_DATABASE_URL`) |
| `npm run typecheck` | TypeScript checks for server and client |
| `npm run build` | Production build of the API (`server/dist`) and the site (`client/dist`) |

## Tests

`npm test` runs 55 API tests with Vitest and Supertest. They cover:
- sign-in, refresh-token rotation, logout and the password policy;
- the permissions of each role, including Media Manager restrictions and Super Admin protections;
- CRUD and validation;
- draft, scheduled and published visibility for pages, news, events, the homepage, programs and announcements;
- media uploads, including rejection of disallowed and spoofed files.

The suite only runs against a database whose name ends in `_test`, and it writes uploads to a temporary directory.

## Host on Vercel

The repository is ready to import into Vercel as one project with two services (`client` and `server` in `vercel.json`). The site and the API share one domain. The browser calls `/api` on that domain, so sign-in cookies stay first-party. Leave `VITE_API_URL` unset.

Vercel cannot run the embedded Postgres or keep uploaded files on disk. This repo is linked to Neon project `polished-hat-22035939`, branch `production`. Lakebase Postgres is the database. The `uploads` bucket in `neon.ts` is Neon Object Storage (`public_read`), and CMS uploads go there when the `AWS_*` variables are set. Cloudinary is only used when those variables are absent.

1. Copy `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and the `AWS_*` values from `.env.local` (created by `neon env pull`). Do not commit that file.
2. In Vercel, import `https://github.com/yousufhasany/uit-landing-page`. Leave the root directory as the repository root (not `client`). The settings in `vercel.json` supply the build command and output directory. Node.js 22.x is a good match.
3. Add these environment variables. Do not commit them. Generate each JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Pooled Neon Postgres URL (hostname contains `-pooler`). The API uses `pg` with this URL. |
| `DATABASE_URL_UNPOOLED` | Direct Neon Postgres URL. Prisma migrations use this. `DIRECT_URL` is accepted as an alias. |
| `JWT_SECRET` | At least 32 characters |
| `JWT_REFRESH_SECRET` | At least 32 characters, different from `JWT_SECRET` |
| `FRONTEND_URL` | The public site origin, for example `https://your-project.vercel.app`. Comma-separate extra origins if you add a custom domain. |
| `BACKEND_URL` | The same origin as `FRONTEND_URL` |
| `COOKIE_SAME_SITE` | `lax` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | Neon Object Storage credentials from `.env.local`. |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` | First Super Admin. Password: 10+ characters with upper case, lower case and a number. |

4. Deploy. The build generates the Prisma client, applies migrations, and builds the site. It does not seed content and it does not reset the database.
5. After the first successful deploy, seed once from your own machine. Point the command at the hosted database (the direct URL is the safer choice) and do not commit that URL:

```powershell
$env:DATABASE_URL="postgresql://…"
$env:DIRECT_URL="postgresql://…"
npm run db:seed
```

Sign in at `https://your-project.vercel.app/admin/login` and change the bootstrap password. Preview deployments on other `*.vercel.app` hosts are allowed automatically, because the API accepts the host that served the page.

Uploads go to the Neon `uploads` bucket. Vercel rejects request bodies larger than 4.5 MB, so keep each CMS upload under 4 MB. A long video will not upload through this host.

To attach a custom domain later, add it in Vercel and append it to `FRONTEND_URL` (comma-separated). Set `BACKEND_URL` to the domain visitors actually use.

## Production deployment

The same application can run on any Node.js host:

1. Set the variables in `server/.env.example`: `NODE_ENV=production`, `DATABASE_URL`, both JWT secrets, `FRONTEND_URL`, `BACKEND_URL`, `CLOUDINARY_*` and the bootstrap admin values.
2. Build: `npm ci && npm run build`.
3. Apply migrations: `npm run db:deploy -w server` (this never resets data). Then run `npm run db:seed` once.
4. Start the API: `npm start -w server`. Serve `client/dist` with a fallback to `index.html`, and route `/api`, `/sitemap.xml` and `/robots.txt` to the API on the same origin.
5. Use HTTPS. Cookies are `Secure` in production.

See [UIT_DATABASE_ARCHITECTURE.md](docs/UIT_DATABASE_ARCHITECTURE.md#6-backups-and-restore) for backups.

## Security notes

- Secrets exist only in environment variables. `.env` files are git-ignored, and the client receives no secrets.
- Every CMS action is authorized on the server by permission. Hiding buttons in the UI is only a convenience.
- No administrator credentials are hard-coded. The first Super Admin comes from `BOOTSTRAP_ADMIN_*`.
- `npm audit` reports a high-severity ReDoS advisory ([GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw)) in `effect`. Only the Prisma CLI's config loader (`prisma` → `@prisma/config`, a dev dependency used to run migrations) pins that version. The running API uses `@prisma/client` and never loads it, and no user input reaches it. npm's suggested fix downgrades Prisma to v6. Upgrade `prisma` once a release ships a patched `effect`.

## Content

Everything on the site comes from the documents and photographs in `source-materials/` (left unmodified). Items the sources don't confirm, or on which they disagree, are saved as drafts or carry a **Verify** badge in the CMS. See the content plan for the list.
