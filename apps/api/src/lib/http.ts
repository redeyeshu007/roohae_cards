/**
 * FILE PURPOSE:
 * Express HTTP helpers, async route wrappers, and API success response formatters.
 *
 * MAIN RESPONSIBILITY:
 * Provides asyncHandler to prevent unhandled promise rejections, formats standardized JSON envelopes
 * (ok, created) matching ApiSuccess<T>, and parses pagination query parameters (page, limit, sort, search).
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/* (*.routes.ts and *.controller.ts utilize ok, created, and parsePagination)
 * - packages/shared/src/types/api.ts (implements ApiSuccess and PaginationMeta contracts)
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PaginationMeta } from '@roohae/shared';

/** Wrap async route handlers so rejections flow to the error middleware. */
// ASYNC ROUTE HANDLER WRAPPER:
// Catches unhandled Promise rejections and forwards them to Express error middleware.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// SUCCESS RESPONSE FORMATTER (200 OK):
// Serializes payload inside standard { success: true, data, meta } envelope.
export function ok<T>(res: Response, data: T, meta?: PaginationMeta, status = 200): void {
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, undefined, 201);
}

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sort: Record<string, 1 | -1>;
}

export function parsePagination(req: Request, defaultSort = '-createdAt'): PageParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.search === 'string' && req.query.search.trim() !== ''
    ? req.query.search.trim()
    : undefined;

  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : defaultSort;
  const sort: Record<string, 1 | -1> = {};
  for (const field of sortRaw.split(',')) {
    const trimmed = field.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('-')) sort[trimmed.slice(1)] = -1;
    else sort[trimmed] = 1;
  }

  return { page, limit, skip: (page - 1) * limit, search, sort };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
