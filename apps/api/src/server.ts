/**
 * FILE PURPOSE:
 * HTTP server bootstrap and graceful shutdown lifecycle manager.
 *
 * MAIN RESPONSIBILITY:
 * Connects to MongoDB, starts the Express HTTP listener on configured PORT,
 * and handles process termination signals (SIGINT, SIGTERM) to close connections cleanly.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/config/database.ts (database connectivity)
 * - apps/api/src/app.ts (Express application factory)
 * - apps/api/src/config/env.ts (environment configuration)
 */

import http from 'node:http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './lib/logger';

// SERVER BOOTSTRAP:
// Initializes database connections and binds HTTP server to configured port.
async function main(): Promise<void> {

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`🚀 Roohae Cards API listening on ${env.API_BASE_URL} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
