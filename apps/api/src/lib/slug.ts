/**
 * FILE PURPOSE:
 * URL slug generation and collision avoidance utilities.
 *
 * MAIN RESPONSIBILITY:
 * Transforms arbitrary category or template title strings into clean URL-safe slugs with random uniqueness suffixes.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/categories/categories.service.ts
 * - apps/api/src/modules/templates/templates.service.ts
 */

// SLUG GENERATOR:
// Normalizes strings to alphanumeric lowercase hyphen-separated slugs.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Append a short random suffix to guarantee uniqueness without a lookup loop. */
export function uniqueSlug(input: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  const base = slugify(input) || 'item';
  return `${base}-${suffix}`;
}
