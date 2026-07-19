import type { Font } from '@roohae/shared';

const loaded = new Set<string>();

/**
 * Register uploaded font families with the browser via the FontFace API so
 * the canvas can render them. Idempotent per face.
 */
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
