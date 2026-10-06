/**
 * FILE PURPOSE:
 * Structured operational API error definitions and HTTP status factories.
 *
 * MAIN RESPONSIBILITY:
 * Provides the ApiError class with typed machine-readable error codes (e.g. BAD_REQUEST, UNAUTHORIZED,
 * FORBIDDEN, NOT_FOUND, CONFLICT, UNPROCESSABLE) for uniform error responses across the backend.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/middlewares/error.middleware.ts (serializes ApiError into JSON response envelope)
 * - apps/api/src/modules/* (services throw ApiError instances)
 */

// OPERATIONAL API ERROR CLASS:
// Custom error class capturing HTTP status code, machine-readable code, message, and diagnostic details.
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'CONFLICT', message);
  }

  static unprocessable(message: string, details?: unknown): ApiError {
    return new ApiError(422, 'UNPROCESSABLE', message, details);
  }

  static tooLarge(message = 'Payload too large'): ApiError {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static internal(message = 'Something went wrong'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
