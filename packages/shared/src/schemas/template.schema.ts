/**
 * FILE PURPOSE:
 * Zod validation schemas for Template authoring and catalog lifecycle.
 *
 * MAIN RESPONSIBILITY:
 * Validates admin template creation, updates to document JSON / thumbnails,
 * and status transitions (draft, published, archived).
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/templates/ (validates incoming admin template operations)
 * - apps/admin/src/app/(panel)/templates/ (creation dialog form validation)
 * - apps/admin/src/app/editor/[templateId]/page.tsx (template autosave payloads)
 */

import { z } from 'zod';
import { MEASUREMENT_UNITS, ORIENTATIONS, TEMPLATE_STATUSES } from '../constants';
import { designDocumentSchema } from './design.schema';

// VALIDATION SCHEMA: CREATE TEMPLATE
// Validates template creation payload on POST /api/templates.
export const createTemplateSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(120),
  categoryId: z.string().min(1, 'Category is required'),
  width: z.number().positive().max(20000),
  height: z.number().positive().max(20000),
  unit: z.enum(MEASUREMENT_UNITS),
  orientation: z.enum(ORIENTATIONS),
  tags: z.array(z.string().max(40)).max(20).default([]),
});

// VALIDATION SCHEMA: UPDATE TEMPLATE
// Validates template document changes, metadata edits, and thumbnail updates on PATCH /api/templates/:id.
export const updateTemplateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  document: designDocumentSchema.optional(),
  thumbnail: z.string().optional(), // data URL, converted to an asset server-side
});

// VALIDATION SCHEMA: UPDATE TEMPLATE STATUS
// Validates publishing status changes on PATCH /api/templates/:id/status.
export const updateTemplateStatusSchema = z.object({
  status: z.enum(TEMPLATE_STATUSES),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

