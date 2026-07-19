import { z } from 'zod';
import { MEASUREMENT_UNITS, ORIENTATIONS, TEMPLATE_STATUSES } from '../constants';
import { designDocumentSchema } from './design.schema';

export const createTemplateSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(120),
  categoryId: z.string().min(1, 'Category is required'),
  width: z.number().positive().max(20000),
  height: z.number().positive().max(20000),
  unit: z.enum(MEASUREMENT_UNITS),
  orientation: z.enum(ORIENTATIONS),
  tags: z.array(z.string().max(40)).max(20).default([]),
});

export const updateTemplateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  document: designDocumentSchema.optional(),
  thumbnail: z.string().optional(), // data URL, converted to an asset server-side
});

export const updateTemplateStatusSchema = z.object({
  status: z.enum(TEMPLATE_STATUSES),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
