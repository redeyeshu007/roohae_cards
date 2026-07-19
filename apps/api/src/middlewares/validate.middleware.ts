import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

/** Validate and coerce a request segment with a Zod schema. Replaces the segment with parsed data. */
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
