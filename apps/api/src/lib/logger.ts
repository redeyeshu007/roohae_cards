/**
 * FILE PURPOSE:
 * Structured logging service using Pino.
 *
 * MAIN RESPONSIBILITY:
 * Provides fast JSON logging in production and colorized pretty-printed logs in development.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/server.ts (server lifecycle logging)
 * - apps/api/src/middlewares/error.middleware.ts (exception logging)
 * - apps/api/src/storage/* (storage transaction logs)
 */

import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

// STRUCTURED LOGGER:
// Pino logger instance with environment-aware formatting.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }),
});
