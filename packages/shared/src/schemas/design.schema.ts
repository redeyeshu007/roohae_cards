import { z } from 'zod';

/**
 * Design objects carry arbitrary Fabric serialization fields, so the schema
 * validates the Roohae envelope strictly and passes the rest through.
 */
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

export const designPageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  background: z.string().default('#ffffff'),
  backgroundAssetId: z.string().optional(),
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

export const designDocumentSchema = z.object({
  version: z.literal(1),
  width: z.number().int().positive().max(30000),
  height: z.number().int().positive().max(30000),
  pages: z.array(designPageSchema).min(1, 'A design needs at least one page').max(100),
});
