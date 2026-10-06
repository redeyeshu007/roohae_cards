/**
 * FILE PURPOSE:
 * MongoDB Mongoose connection manager and lifecycle handler.
 *
 * MAIN RESPONSIBILITY:
 * Establishes Mongoose connection pools to the configured MongoDB replica set / instance,
 * attaches connectivity lifecycle logging, and gracefully drains connections on shutdown.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/server.ts (calls connectDatabase on boot and disconnectDatabase on shutdown)
 * - apps/api/src/modules/* (*.model.ts Mongoose schemas execute queries over this connection pool)
 */

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../lib/logger';

// DATABASE CONNECTION:
// Establishes primary Mongoose MongoDB client connection with a connection pool size of 20.
export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
