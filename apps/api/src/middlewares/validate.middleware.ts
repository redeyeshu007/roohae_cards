/**
 * FILE PURPOSE:
 * Generic Zod schema request validation middleware.
 *
 * MAIN RESPONSIBILITY:
 * Validates request body, query params, or URL route params against shared Zod schemas,
 * replacing the validated target with the strongly-typed coerced result or forwarding ZodError to errorHandler.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/* (*.routes.ts routes wrap request handlers with validate(schema))
 * - packages/shared/src/schemas/* (provides the Zod schemas)
 */

import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

/** Validate and coerce a request segment with a Zod schema. Replaces the segment with parsed data. */
// REQUEST VALIDATION MIDDLEWARE:
// Parses incoming payload with target Zod schema and sanitizes input data.
export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    (req as Record<Target, unknown>)[target] = result.data;
    next();
  };
}
