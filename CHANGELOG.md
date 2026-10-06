# Changelog — Roohae Cards

All notable changes and milestones for the Roohae design and publishing platform are documented in this file.

---

## [Current] - 2026-10-02

### Added
- **Background Remover**: Integrated client-side background removal tool into `PropertiesPanel.tsx` using `RoohaeEditor.removeBackgroundFromSelected()`. Employs perimeter border chroma sampling and soft-alpha edge matting with customizable color distance tolerance.
- **Digital Signature Tool**: Added signature creator in `ToolsPanel.tsx` supporting:
  - Text input with specialized cursive Google Fonts (Dancing Script, Great Vibes, Pacifico, Caveat, Satisfy, Alex Brush, Sacramento).
  - Freehand HTML5 Canvas signature pad with dynamic stroke thickness and smoothing.
  - Transparent signature image file upload.
- **Custom WordArt & Sticky Notes**: Instant presets for stylized typography layers and editable colored sticky note objects.
- **Context Menu & Background Panel**: Right-click canvas menu for quick duplication, layer arrangement, alignment, locking, and dedicated background image control panel with blur, opacity, and fit options (fit/fill/stretch).
- **Multi-page 300 DPI PDF Export**: Native vector/raster conversion in `ExportService.ts` generating print-ready PDF files via `pdf-lib` at physical dimensions ($(\text{width} / 300) \times 72$ pt).
- **Flip Animation Preview**: Multi-page preview modal with card-flip animation for realistic front/back card inspection.

### Updated
- **Properties Panel UI**: Refined right-rail styling into an ultra-clean, Canva-style layout with structured cards, gold/neutral tones, micro-interactions, and contextual tab display.
- **Procedural Border Engine**: Switched `PageBorder` to internally force native `strokeWidth = 0` and render procedural dashed/dotted paths, preventing bounding-box expansion, drift, or coordinate misalignment during selection.
- **Asset Resolution Pipeline**: Enhanced `useResolveAssets` hook and `assetMapRef` synchronization so dynamically inserted images, replacements, and background-removed assets resolve instantly without re-mounting the canvas.

### Fixed
- **Image Shift on Background Removal**: Fixed coordinate transformation bug where replacing an image with its background-removed data URL shifted position; preserved exact `left`, `top`, `scaleX`, `scaleY`, `originX`, `originY`, `angle`, `cropX`, and `cropY`.
- **Render Deployment Build Errors**: Relocated `@types/*`, `typescript`, and `@tailwindcss/postcss` into standard dependencies to ensure clean Next.js 15 compilation in production containers.
- **Font Swap Flash**: Configured Google Fonts display to `swap` and gated canvas mounting on `loadFonts()`, preventing layout reflow and font swap pop-in.
- **PDF Export Background Rendering**: Resolved issue where custom background images with opacity or blur filters failed to render in static offscreen export canvas.

### Known Issues & Observations
- **External Font Network Fallback**: If third-party Google Font CDNs are blocked by local firewalls, font registration waits until browser timeout before continuing with fallback web-safe fonts.
- **Local Storage File URLs**: In `STORAGE_DRIVER=local` mode, file URLs resolve against `http://localhost:4000/uploads/`. Production deployments require configuring `STORAGE_DRIVER=r2` with public domain routing.

---

## [Initial Platform Release]

*Historical changes prior to commit `53a86ba` were part of the initial platform bootstrapping phase:*
- Established monorepo architecture (`packages/shared`, `packages/editor-sdk`, `packages/ui`, `apps/api`, `apps/admin`, `apps/user`).
- Implemented JWT authentication with rotation and token versioning.
- Implemented Mongoose schemas for Users, Categories, Templates, Projects, Assets, Fonts, and Activity Logs.
- Built Fabric.js visual editor facade (`RoohaeEditor`).
- Built customer template customization with server-side locked field validation.
