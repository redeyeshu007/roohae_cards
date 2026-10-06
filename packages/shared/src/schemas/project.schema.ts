/**
 * FILE PURPOSE:
 * Zod validation schemas for User Projects (customized template instances).
 *
 * MAIN RESPONSIBILITY:
 * Enforces validation rules on project creation and subsequent autosaves/updates,
 * ensuring valid template linkage, document payloads, and thumbnails.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/projects/ (validates incoming project persistence requests)
 * - apps/user/src/components/ProjectEditor.tsx (validates save payloads)
 */

import { z } from 'zod';
import { designDocumentSchema } from './design.schema';

// VALIDATION SCHEMA: CREATE PROJECT
// Validates user-initiated project instantiation from a template on POST /api/projects.
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

// VALIDATION SCHEMA: UPDATE PROJECT
// Validates updates and autosaves to an existing project on PATCH /api/projects/:id.
export const updateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  document: designDocumentSchema.optional(),
  thumbnail: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

