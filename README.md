# Roohae Cards

A template-driven design platform (Canva-class SaaS). Admins author and publish design
templates; users customize copies of published templates and download print-ready exports.
Users can never create blank designs, upload assets, or touch original templates.

## Architecture

```
roohae_cards/
├─ apps/
│  ├─ api/          Express + TypeScript + MongoDB REST API (port 4000)
│  ├─ admin/        Next.js 15 admin console (port 3000)
│  └─ user/         Next.js 15 user platform (port 3001)
├─ packages/
│  ├─ shared/       Domain types, constants, Zod schemas (single source of truth)
│  ├─ editor-sdk/   Fabric.js abstraction — React never touches Fabric directly
│  └─ ui/           Design system, API client, auth store, shared Editor workspace
```

### Key design decisions

- **Editor SDK boundary** — `RoohaeEditor` wraps Fabric.js completely. React components
  consume a typed facade (`addText`, `updateSelection`, `getDocument`, events…). Swapping
  the rendering engine (Phase 3) touches one package.
- **Design documents** — templates/projects persist an editor-agnostic JSON document
  (pages → objects). Binary assets are **never** embedded; objects reference `assetId`
  and URLs are resolved at load time.
- **Editable-field locking** — every object carries `editable: boolean` set by the admin.
  In user mode the SDK renders non-editable objects inert, and the API re-verifies on
  every save that locked objects arrive byte-identical (a tampered client cannot cheat).
- **Asset quality** — originals are stored byte-for-byte (content-addressed keys, deduped).
  Thumbnails are *separate* derived WebP variants. The editor and all exports always use
  originals. Exports render on an offscreen canvas at native resolution (PDF at 300 DPI).
- **Storage abstraction** — `StorageProvider` interface with `local` (dev, served by
  Express) and `r2` (Cloudflare R2 via S3 API) drivers, chosen by env.
- **Auth** — JWT access + refresh tokens with rotation and token-version revocation.
  One `users` collection with a `role` field (admin/user); admin console sign-in
  rejects non-admin accounts. Roles are enforced per-route with middleware.
- **Users vs admins** — publishing state machine (draft → published → archived); users
  can only list/read *published* templates (enforced server-side, not by the client).

## Getting started

Prereqs: Node ≥ 20, MongoDB running locally (or a connection string).

```bash
npm install

# 1. Configure the API
cp apps/api/.env.example apps/api/.env      # adjust MONGODB_URI + JWT secrets

# 2. Seed the admin account + starter categories
npm run seed

# 3. Run everything (three terminals)
npm run dev:api     # http://localhost:4000
npm run dev:admin   # http://localhost:3000
npm run dev:user    # http://localhost:3001
```

Default seeded admin: `admin@roohae.com` / `Admin@12345` (change via `SEED_ADMIN_*` env).

Frontends read `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

## Workflows

**Admin**: Sign in → Categories (name + width/height/unit/orientation) → Templates →
"Create template" (category auto-fills dimensions, still adjustable) → editor opens →
design with text/shapes/images/fonts, mark objects **User editable** on/off, manage
pages & layers → autosaves every 4s → **Publish**.

**User**: Sign in → browse published templates by category → click one → a project is
created as a deep copy → editor opens with locked elements inert → edits autosave →
**Preview** → **Download** PNG / JPG / PDF at full resolution.

## API surface (v1)

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/admin/login`, `/auth/refresh`, `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/change-password` |
| Categories | `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id` |
| Templates | `GET/POST /templates`, `GET/PATCH/DELETE /templates/:id`, `PATCH /templates/:id/status`, `POST /templates/:id/duplicate` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id` |
| Assets | `GET/POST /assets`, `POST /assets/resolve`, `DELETE /assets/:id` |
| Fonts | `GET/POST /fonts`, `PATCH /fonts/:id/active`, `DELETE /fonts/:id` |
| Admin | `GET /users`, `PATCH /users/:id/active`, `GET /dashboard/stats`, `GET /dashboard/activity` |

All responses use the `{ success, data, meta? } | { success: false, error }` envelope.

## Production

- Set `STORAGE_DRIVER=r2` with the `R2_*` variables; originals get immutable cache headers.
- `npm run build` builds every workspace (API bundles via tsup → `node dist/server.js`).
- Rate limiting, helmet, CORS allowlist, compression and graceful shutdown are built in.

## Roadmap (spec phases)

- **Phase 2**: version history, folders, brand kit, Redis + BullMQ (server-side export
  queue), Socket.io, team workspaces.
- **Phase 3**: AI features, PSD import, Photoshop plugin, realtime collaboration,
  custom rendering engine (enabled by the Editor SDK boundary).
