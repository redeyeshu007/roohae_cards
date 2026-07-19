import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import type { PutObjectInput, StorageProvider } from './storage.provider';

/**
 * Development storage: writes originals to the local uploads directory and
 * serves them via express.static under /uploads.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local' as const;
  readonly rootDir: string;

  constructor() {
    this.rootDir = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
  }

  private resolveSafe(key: string): string {
    const full = path.resolve(this.rootDir, key);
    if (!full.startsWith(this.rootDir)) {
      throw new Error(`Refusing to write outside upload dir: ${key}`);
    }
    return full;
  }

  async put({ key, body }: PutObjectInput): Promise<void> {
    const full = this.resolveSafe(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveSafe(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  publicUrl(key: string): string {
    return `${env.API_BASE_URL}/uploads/${key.split(path.sep).join('/')}`;
  }
}
