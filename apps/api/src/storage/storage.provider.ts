/**
 * FILE PURPOSE:
 * Contract and interface definitions for storage providers.
 *
 * MAIN RESPONSIBILITY:
 * Defines PutObjectInput and StorageProvider interfaces (put, delete, publicUrl) implemented by local and R2 drivers.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/storage/local.storage.ts
 * - apps/api/src/storage/r2.storage.ts
 */

export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  /** Immutable cache for content-addressed keys. */
  cacheControl?: string;
}

// STORAGE DRIVER INTERFACE:
// Abstract contract for object storage backends.
export interface StorageProvider {

  readonly name: 'local' | 'r2';
  put(input: PutObjectInput): Promise<void>;
  delete(key: string): Promise<void>;
  /** Public URL the browser can load the object from. */
  publicUrl(key: string): string;
}
