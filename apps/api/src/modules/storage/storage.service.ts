import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import { Readable } from 'stream';

export interface StorageObjectStream {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  eTag?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly publicEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123');

    this.s3Client = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT');
    if (!publicEndpoint) {
      this.logger.warn(
        'MINIO_PUBLIC_ENDPOINT not set — using http://localhost:9000. ' +
        'In production, set this to a browser-accessible URL (e.g. http://YOUR_IP/minio)',
      );
    }
    this.publicEndpoint = publicEndpoint || 'http://localhost:9000';
  }

  /**
   * Upload a file buffer to MinIO
   */
  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    const url = this.getPublicUrl(bucket, key);
    this.logger.debug(`Uploaded ${key} to ${bucket}`);
    return url;
  }

  async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`Created bucket: ${bucket}`);
    } catch (err: any) {
      if (
        err?.name === 'BucketAlreadyOwnedByYou' ||
        err?.name === 'BucketAlreadyExists' ||
        err?.Code === 'BucketAlreadyOwnedByYou'
      ) {
        return;
      }
      throw err;
    }
  }

  async getSignedReadUrl(
    bucket: string,
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getObjectStream(bucket: string, key: string): Promise<StorageObjectStream> {
    const result = await this.s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    if (!result.Body) {
      throw new Error(`Object ${bucket}/${key} has no readable body`);
    }

    return {
      stream: this.toNodeReadable(result.Body),
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
      eTag: result.ETag,
    };
  }

  /**
   * Stream a local file to MinIO
   */
  async uploadFromPath(
    bucket: string,
    key: string,
    filePath: string,
    contentType: string,
  ): Promise<string> {
    const stream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        ContentLength: stat.size,
      }),
    );

    const url = this.getPublicUrl(bucket, key);
    this.logger.debug(`Uploaded ${filePath} → ${bucket}/${key}`);
    return url;
  }

  /**
   * Delete a single object from MinIO
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    this.logger.debug(`Deleted ${bucket}/${key}`);
  }

  /**
   * Delete all objects with a given prefix (folder)
   */
  async deleteFolder(bucket: string, prefix: string): Promise<void> {
    let continuationToken: string | undefined;

    do {
      const listResult = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = listResult.Contents;
      if (objects && objects.length > 0) {
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects.map((obj) => ({ Key: obj.Key })),
              Quiet: true,
            },
          }),
        );
      }

      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);

    this.logger.debug(`Deleted folder ${bucket}/${prefix}`);
  }

  /**
   * Get public URL for an object
   */
  getPublicUrl(bucket: string, key: string): string {
    return `${this.publicEndpoint}/${bucket}/${key}`;
  }

  /**
   * Check if an object exists
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private toNodeReadable(body: unknown): Readable {
    if (body instanceof Readable) {
      return body;
    }

    const maybeBody = body as {
      transformToWebStream?: () => ReadableStream;
      transformToByteArray?: () => Promise<Uint8Array>;
    };

    if (typeof maybeBody.transformToWebStream === 'function') {
      return Readable.fromWeb(maybeBody.transformToWebStream() as any);
    }

    if (typeof maybeBody.transformToByteArray === 'function') {
      return Readable.from((async function* () {
        const bytes = await maybeBody.transformToByteArray!();
        yield Buffer.from(bytes);
      })());
    }

    throw new Error('Unsupported S3 object body stream type');
  }
}
