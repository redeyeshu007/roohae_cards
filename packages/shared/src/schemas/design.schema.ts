/**
 * FILE PURPOSE:
 * Zod validation schemas for the Roohae design document format.
 *
 * MAIN RESPONSIBILITY:
 * Enforces structural integrity of persisted design documents, pages,
 * and canvas objects during serialization and API transmissions.
 *
 * CONNECTED SYSTEMS:
 * - apps/api (validates template and project document payloads)
 * - packages/editor-sdk (serializes Fabric canvas state to match this schema)
 * - apps/admin & apps/user (deserializes templates and projects for rendering)
 */

import { z } from 'zod';

/**
 * Design objects carry arbitrary Fabric serialization fields, so the schema
 * validates the Roohae envelope strictly and passes the rest through.
 */
// VALIDATION SCHEMA: DESIGN OBJECT
// Validates an individual canvas element's metadata envelope while preserving Fabric properties.
export const designObjectSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    name: z.string().default(''),
    editable: z.boolean().default(false),
    locked: z.boolean().default(false),
    hidden: z.boolean().default(false),
    assetId: z.string().optional(),
  })
  .passthrough();

// VALIDATION SCHEMA: DESIGN PAGE
// Validates a single page's metadata, background settings, source PDF links, and child objects.
export const designPageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  background: z.string().default('#ffffff'),
  backgroundAssetId: z.string().optional(),
  backgroundImageSettings: z.object({
    fit: z.enum(['fit', 'fill', 'stretch', 'center', 'tile']),
    opacity: z.number().min(0).max(100),
    blur: z.number().min(0).max(100),
    rotation: z.number().optional(),
  }).optional(),
  sourcePdfAssetId: z.string().optional(),
  sourcePdfPageNumber: z.number().int().positive().optional(),
  sourcePdfPreview: z
    .object({
      assetId: z.string().min(1),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .optional(),
  objects: z.array(designObjectSchema),
});

// VALIDATION SCHEMA: DESIGN DOCUMENT
// Validates root multi-page design document with strict versioning and dimensional bounds.
export const designDocumentSchema = z.object({
  version: z.literal(1),
  width: z.number().int().positive().max(30000),
  height: z.number().int().positive().max(30000),
  pages: z.array(designPageSchema).min(1, 'A design needs at least one page').max(100),
});

