/**
 * FILE PURPOSE:
 * Dynamic web font loader and browser cache manager for custom typography.
 *
 * MAIN RESPONSIBILITY:
 * Dynamically registers custom server-uploaded font files using the browser native FontFace API,
 * ensuring canvas text rendering produces pixel-perfect typography matching font descriptors.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/app/editor/[templateId]/page.tsx (pre-loads template fonts on mount)
 * - apps/user/src/components/ProjectEditor.tsx (pre-loads project fonts on mount)
 * - packages/editor-sdk/src/ExportService.ts (ensures fonts are loaded before offscreen canvas export)
 */

import type { Font } from '@roohae/shared';

// FONT CACHE:
// In-memory set tracking already loaded fonts to avoid duplicate network requests.
const loaded = new Set<string>();

/**
 * Register uploaded font families with the browser via the FontFace API so
 * the canvas can render them. Idempotent per face.
 */
// FONT LOADING PIPELINE:
// Loads font files into document.fonts and registers them for Fabric.js text rendering.
export async function loadFonts(fonts: Font[]): Promise<void> {

  const jobs: Promise<unknown>[] = [];
  for (const font of fonts) {
    for (const face of font.faces) {
      const cacheKey = `${font.family}:${face.weight}:${face.style}`;
      if (loaded.has(cacheKey)) continue;
      loaded.add(cacheKey);
      const fontFace = new FontFace(font.family, `url("${face.url}") format("${face.format}")`, {
        weight: String(face.weight),
        style: face.style,
      });
      jobs.push(
        fontFace
          .load()
          .then((f) => document.fonts.add(f))
          .catch(() => loaded.delete(cacheKey)),
      );
    }
  }
  await Promise.allSettled(jobs);
}
