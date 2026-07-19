/**
 * Seeds the initial admin account and a starter set of categories.
 * Idempotent — safe to run repeatedly.
 *
 *   npm run seed
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { slugify } from '../lib/slug';
import { UserModel } from '../modules/users/user.model';
import { CategoryModel } from '../modules/categories/category.model';

const STARTER_CATEGORIES = [
  { name: 'Instagram Post', width: 1080, height: 1080, unit: 'px', orientation: 'portrait' },
  { name: 'Instagram Story', width: 1080, height: 1920, unit: 'px', orientation: 'portrait' },
  { name: 'Facebook Post', width: 1200, height: 630, unit: 'px', orientation: 'landscape' },
  { name: 'Business Card', width: 89, height: 51, unit: 'mm', orientation: 'landscape' },
  { name: 'Certificate', width: 297, height: 210, unit: 'mm', orientation: 'landscape' },
  { name: 'Invitation', width: 127, height: 178, unit: 'mm', orientation: 'portrait' },
  { name: 'Resume', width: 210, height: 297, unit: 'mm', orientation: 'portrait' },
  { name: 'Poster', width: 420, height: 594, unit: 'mm', orientation: 'portrait' },
  { name: 'Logo', width: 1000, height: 1000, unit: 'px', orientation: 'portrait' },
  { name: 'Banner', width: 1920, height: 480, unit: 'px', orientation: 'landscape' },
  { name: 'Presentation', width: 1920, height: 1080, unit: 'px', orientation: 'landscape' },
  { name: 'Document', width: 210, height: 297, unit: 'mm', orientation: 'portrait' },
] as const;

async function main(): Promise<void> {
  await connectDatabase();

  let admin = await UserModel.findOne({ email: env.SEED_ADMIN_EMAIL }).exec();
  if (!admin) {
    admin = await UserModel.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
      role: 'admin',
    });
    logger.info(`Created admin account: ${admin.email}`);
  } else {
    logger.info(`Admin already exists: ${admin.email}`);
  }

  for (const cat of STARTER_CATEGORIES) {
    const slug = slugify(cat.name);
    const exists = await CategoryModel.findOne({ slug }).exec();
    if (exists) continue;
    await CategoryModel.create({ ...cat, slug, createdBy: admin._id });
    logger.info(`Created category: ${cat.name}`);
  }

  await disconnectDatabase();
  logger.info('✅ Seed complete');
}

main().catch((err) => {
  logger.fatal({ err }, 'Seed failed');
  process.exit(1);
});
