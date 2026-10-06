/**
 * FILE PURPOSE:
 * Zod validation schemas for Category management in Roohae.
 *
 * MAIN RESPONSIBILITY:
 * Enforces schema constraints on category creation and updates,
 * including dimension boundaries, measurement units, and orientation.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/categories/ (request validation on POST and PATCH)
 * - apps/admin/src/app/(panel)/categories/ (admin category forms)
 */

import { z } from 'zod';
import { MEASUREMENT_UNITS, ORIENTATIONS } from '../constants';

// VALIDATION SCHEMA: CREATE CATEGORY
// Validates parameters when creating a new card category via POST /api/categories.
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name is too short').max(60),
  width: z.number().positive('Width must be positive').max(20000),
  height: z.number().positive('Height must be positive').max(20000),
  unit: z.enum(MEASUREMENT_UNITS),
  orientation: z.enum(ORIENTATIONS),
  description: z.string().max(500).optional(),
});

// VALIDATION SCHEMA: UPDATE CATEGORY
// Validates partial updates to existing categories via PATCH /api/categories/:id.
export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

