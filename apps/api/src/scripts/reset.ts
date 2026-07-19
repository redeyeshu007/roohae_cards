/**
 * DANGER: wipes the ENTIRE database, then recreates only the admin account
 * from SEED_ADMIN_* env. Also empties the local uploads directory when the
 * local storage driver is active. Refuses to run in production.
 *
 *   npm run reset --workspace @roohae/api
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { env, isProd } from '../config/env';
import { logger } from '../lib/logger';
import { UserModel } from '../modules/users/user.model';

async function main(): Promise<void> {
  if (isProd) {
    logger.fatal('Refusing to reset a production database');
    process.exit(1);
  }

  await connectDatabase();

  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const { name } of collections) {
    await mongoose.connection.db!.dropCollection(name);
    logger.info(`Dropped collection: ${name}`);
  }

  const admin = await UserModel.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
    role: 'admin',
  });
  logger.info(`Recreated admin account: ${admin.email}`);

  if (env.STORAGE_DRIVER === 'local') {
    const uploadsDir = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
    async function clearFiles(dirPath: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await clearFiles(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }
    }
    await clearFiles(uploadsDir);
    logger.info(`Cleared files from uploads directory: ${uploadsDir}`);
  }

  await disconnectDatabase();
  logger.info('✅ Reset complete — database contains only the admin account');
}

main().catch((err) => {
  logger.fatal({ err }, 'Reset failed');
  process.exit(1);
});
