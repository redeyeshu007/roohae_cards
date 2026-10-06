# Project Context & Developer Continuity Guide — Roohae

> **MANDATORY READING FOR ANY DEVELOPER JOINING OR MODIFYING THIS CODEBASE.**  
> Roohae is an active production system with strict architectural boundaries. This document outlines the continuity rules, system lifecycles, and non-negotiable boundaries you must respect.

---

## 1. What Roohae Is

Roohae is a template-driven design platform (similar to Canva) focused on print-ready and digital cards, invitations, and branded collateral.

The core business principle is **controlled customization**:
- **Admins** have unrestricted design control over master templates.
- **Users** can customize only what the admin explicitly permits (`roohEditable: true`).
- **Users can NEVER**:
  1. Create a blank design from scratch.
  2. Touch or mutate an original master template.
  3. Modify, delete, or move locked elements (brand logos, fixed headers, base frames).
  4. Upload unapproved asset types or bypass template placeholder gallery constraints.

---

## 2. Core Architecture & Monorepo Topology

```
roohae_cards/
├── packages/
│   ├── shared/        # Single source of truth. Zero internal dependencies.
│   │                  # Contains Zod schemas, domain interfaces, and measurement constants.
│   ├── editor-sdk/    # Strict facade over Fabric.js v6 and pdf-lib.
│   │                  # React components NEVER touch Fabric canvas directly.
│   └── ui/            # UI components, EditorWorkspace, PropertiesPanel, ToolsPanel, API client.
└── apps/
    ├── api/           # Express + TypeScript + MongoDB REST API (Port 4000).
    ├── admin/         # Next.js 15 App Router Admin Console (Port 3000).
    └── user/          # Next.js 15 App Router Customer Platform (Port 3001).
```

### Critical Dependency Rules
- **UI → Editor SDK**: UI components communicate exclusively with `RoohaeEditor`. Never import `fabric` directly inside `apps/` or `packages/ui/`.
- **Backend ↔ Frontend**: All validation schemas (Zod) in `packages/shared/src/schemas/` are shared. Changing a schema in shared immediately validates both API request parsing and frontend form submission.

---

## 3. DO NOT BREAK THESE SYSTEMS

The following 8 systems have delicate mathematical and security constraints. **Do not casually refactor or alter their core mechanics:**

### 1. Border Engine (`packages/editor-sdk/src/BorderLayerManager.ts`)
- **Do not use native Fabric `strokeWidth`**: Native `strokeWidth` expands Fabric's bounding box and shifts origin offsets during object selection. `PageBorder` forces `strokeWidth = 0` and renders thickness manually via `roohBorderThickness`.
- **Do not alter center alignment**: Border coordinates are pinned to `(docWidth / 2, docHeight / 2)` with `originX: 'center'` and `originY: 'center'`. This guarantees symmetric padding scaling.
- **Procedural miter corners**: Dashed border rendering relies on procedural dash length calculation ($D = 18\text{px}$) and renders solid miters in the corners. Do not replace this with simple SVG line dashes.

### 2. Canvas & Coordinate Space (`packages/editor-sdk/src/RoohaeEditor.ts`)
- Canvas viewport uses dynamic aspect-ratio scaling. The document width and height represent real points/pixels, not DOM CSS dimensions.
- All object coordinates (`left`, `top`, `scaleX`, `scaleY`, `angle`) must remain in native document space.
- When replacing an image (e.g., Background Remover, image upload replacement), **preserve all geometric transformation properties** (`originX`, `originY`, `scaleX`, `scaleY`, `cropX`, `cropY`, `angle`).

### 3. History Engine (`packages/editor-sdk/src/HistoryManager.ts`)
- Snapshots are taken on discreet mutations.
- Slider interactions (opacity, thickness, tolerance) must debounce or commit history only on slider release (`pointerup` / `changeEnd`), never on every mouse tick.

### 4. Authentication & Token Revocation (`apps/api/src/modules/auth/`)
- JWT access tokens (15-min TTL) and refresh tokens (30-day TTL) use rotating tokens with `tokenVersion` stored in the database.
- Admin authentication enforces `role === 'admin'`. Never bypass `requireAdmin` middleware on administrative endpoints.
- User and Admin sessions use separate storage keys (`roohae_user_auth` vs `roohae_admin_auth`) to allow developers and operators to test both personas simultaneously in the same browser.

### 5. Layer & Editable Object Hierarchy
- Every canvas object carries custom metadata: `id`, `name`, `roohEditable`, `locked`, `hidden`, `roohAssetType`.
- In User mode, locked objects have `selectable = false`, `evented = false`, and `hasControls = false`.
- The user can select only objects where `roohEditable === true`.

### 6. Template Cloned Project Lifecycle & Tamper-Proofing (`apps/api/src/modules/projects/`)
- A user project is created as a deep copy of a published template (`ProjectModel.create`).
- On every project update (`PATCH /projects/:id`), `projectsService` executes four mandatory security assertions:
  1. `assertObjectSetUnchanged`: Users cannot inject new canvas layers or delete existing ones.
  2. `assertLockedObjectsUnchanged`: Locked objects in the user's document must match the master template byte-for-byte.
  3. `assertPlaceholderRulesRespected`: Replacement images must match the template's allowed asset list if specified.
  4. `assertForeignAssetsOwned`: Users can only attach assets they personally uploaded or global library assets.

### 7. API Communication Contracts
- All API endpoints respond with the standard envelope:
  `{ success: true, data: T, meta?: PageMeta }` or `{ success: false, error: ApiErrorObject }`.
- Do not return raw arrays or unnested objects from Express routes.

### 8. Storage Abstraction (`apps/api/src/storage/`)
- Binary files are never stored in MongoDB.
- MongoDB records only storage keys and URLs.
- In production, use `STORAGE_DRIVER=r2`. In local development, `STORAGE_DRIVER=local` saves to the `uploads/` directory and is served statically by Express.

---

## 4. Key Files & Their Exact Responsibilities

| File | Purpose | Why It Matters |
| :--- | :--- | :--- |
| `packages/editor-sdk/src/RoohaeEditor.ts` | Canvas facade | Main engine wrapping Fabric.js. Controls text, image, background remover, and serialization. |
| `packages/editor-sdk/src/BorderLayerManager.ts` | Border procedural engine | Calculates non-distorting geometric borders with perfect corners. |
| `packages/editor-sdk/src/ExportService.ts` | Offscreen rendering | Exports PNG, JPG, and 300 DPI PDF using native vector dimensions and `pdf-lib`. |
| `packages/ui/src/editor/EditorWorkspace.tsx` | Editor layout root | Houses TopBar, LeftSidebar, center Canvas viewport, and PropertiesPanel. |
| `packages/ui/src/editor/PropertiesPanel.tsx` | Contextual properties rail | Canva-style right sidebar adjusting to active layer (Text, Image, Draw, Border). |
| `packages/ui/src/editor/ToolsPanel.tsx` | Tools selector | Hosts Borders, Draw brushes, Sticky Notes, WordArt, and Signatures. |
| `apps/api/src/modules/projects/projects.service.ts` | Project business rules | Enforces locked-field security and deep copies templates. |
| `apps/api/src/modules/templates/templates.service.ts`| Template lifecycle | Manages template creation, categories, asset collection, and publishing state machine. |
| `apps/admin/src/app/editor/[templateId]/page.tsx` | Admin template studio | Full template authoring interface with publish, asset browsing, and export actions. |
| `apps/user/src/components/ProjectEditor.tsx` | Customer editor interface | Manages draft-to-project conversion, autosave timer, and print downloads. |

---

## 5. Development Rules for Future Engineers

1. **Never change application behavior when asked for documentation or cleanup.**
2. **Never push to GitHub without explicit user instructions.**
3. **Always preserve physical units**: Cards are sized in mm, cm, or inches, converted to points/pixels at 300 DPI. Never hardcode screen-pixel assumptions into export routines.
4. **Never alter the font loading gate**: Fabric canvas mounts only after `loadFonts()` resolves. Bypassing this causes text measurement bugs and layout reflow.
5. **Always test builds across all workspaces**:
   ```bash
   npm run typecheck
   npm run build
   ```
6. **Report issues as observations**: If you discover a bug or architectural flaw, do not silently rewrite the subsystem. Document it in `README.md` and `CHANGELOG.md` under Observations.
