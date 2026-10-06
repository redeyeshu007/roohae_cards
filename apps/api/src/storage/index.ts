/**
 * FILE PURPOSE:
 * Storage driver factory and singleton provider accessor.
 *
 * MAIN RESPONSIBILITY:
 * Returns the configured storage driver singleton: LocalStorageProvider (dev/local disk)
 * or R2StorageProvider (production Cloudflare R2 object storage).
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/assets/assets.service.ts (uploads media files)
 * - apps/api/src/modules/fonts/fonts.service.ts (uploads font files)
 * - apps/api/src/modules/templates/templates.service.ts (uploads thumbnail assets)
 */

import { env } from '../config/env';
import { LocalStorageProvider } from './local.storage';
import { R2StorageProvider } from './r2.storage';
import type { StorageProvider } from './storage.provider';

let instance: StorageProvider | undefined;

// STORAGE PROVIDER SINGLETON:
// Lazy-initializes and returns the active storage adapter based on STORAGE_DRIVER env.
export function getStorage(): StorageProvider {
  if (!instance) {
    instance = env.STORAGE_DRIVER === 'r2' ? new R2StorageProvider() : new LocalStorageProvider();
  }
  return instance;
}

export type { StorageProvider } from './storage.provider';
