import { z } from 'zod';
import { MEASUREMENT_UNITS, ORIENTATIONS } from '../constants';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name is too short').max(60),
  width: z.number().positive('Width must be positive').max(20000),
  height: z.number().positive('Height must be positive').max(20000),
  unit: z.enum(MEASUREMENT_UNITS),
  orientation: z.enum(ORIENTATIONS),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
