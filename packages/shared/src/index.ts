/**
 * FILE PURPOSE:
 * Central entry point and export barrel for the @roohae/shared package.
 *
 * MAIN RESPONSIBILITY:
 * Re-exports shared constants, entity interfaces, design document schemas,
 * API response envelopes, and Zod validation schemas across all apps and packages.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk (consumes design document interfaces and measurement units)
 * - packages/ui (consumes API types, constants, and schemas)
 * - apps/api (consumes Zod schemas for request validation and entities for Mongoose models)
 * - apps/admin & apps/user (consumes schemas and types for form validation and state)
 */

export * from './constants';
export * from './asset-filters';
export * from './types/entities';
export * from './types/design';
export * from './types/api';
export * from './schemas/auth.schema';
export * from './schemas/category.schema';
export * from './schemas/design.schema';
export * from './schemas/template.schema';
export * from './schemas/project.schema';
