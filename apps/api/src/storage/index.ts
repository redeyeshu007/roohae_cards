import { env } from '../config/env';
import { LocalStorageProvider } from './local.storage';
import { R2StorageProvider } from './r2.storage';
import type { StorageProvider } from './storage.provider';

let instance: StorageProvider | undefined;

export function getStorage(): StorageProvider {
  if (!instance) {
    instance = env.STORAGE_DRIVER === 'r2' ? new R2StorageProvider() : new LocalStorageProvider();
  }
  return instance;
}

export type { StorageProvider } from './storage.provider';
