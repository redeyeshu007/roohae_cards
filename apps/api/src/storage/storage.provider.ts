export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  /** Immutable cache for content-addressed keys. */
  cacheControl?: string;
}

export interface StorageProvider {
  readonly name: 'local' | 'r2';
  put(input: PutObjectInput): Promise<void>;
  delete(key: string): Promise<void>;
  /** Public URL the browser can load the object from. */
  publicUrl(key: string): string;
}
