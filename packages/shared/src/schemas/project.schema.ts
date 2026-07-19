import { z } from 'zod';
import { designDocumentSchema } from './design.schema';

export const createProjectSchema = z.object({
  templateId: z.string().min(1, 'Template is required'),
  title: z.string().min(1).max(120).optional(),
  /**
   * The user's customized document from a draft session (first manual Save).
   * Validated server-side against the template's placeholder/lock rules.
   * Omitted → a pristine copy of the template document.
   */
  document: designDocumentSchema.optional(),
  thumbnail: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  document: designDocumentSchema.optional(),
  thumbnail: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
