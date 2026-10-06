/**
 * FILE PURPOSE:
 * Cloudflare R2 object storage provider for production environments.
 *
 * MAIN RESPONSIBILITY:
 * Connects to Cloudflare R2 via AWS S3-compatible client SDK, uploads binary media with
 * immutable caching headers, deletes remote objects, and formats CDN URLs.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/storage/index.ts (instantiates R2StorageProvider if STORAGE_DRIVER=r2)
 * - Cloudflare R2 bucket (remote object store)
 */

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import type { PutObjectInput, StorageProvider } from './storage.provider';

/** Production storage: Cloudflare R2 via the S3-compatible API. */
// CLOUDFLARE R2 DRIVER:
// Production S3-compatible driver for high-durability global asset delivery.
export class R2StorageProvider implements StorageProvider {

  readonly name = 'r2' as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = env.R2_BUCKET!;
    this.publicBaseUrl = env.R2_PUBLIC_BASE_URL!.replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async put({ key, body, contentType, cacheControl }: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
