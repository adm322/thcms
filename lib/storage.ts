import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface UploadResult {
  url: string;
}

/**
 * Universal storage adapter for file uploads.
 * Defaults to local disk (public/uploads) but is architected to seamlessly 
 * swap to Vercel Blob or AWS S3 based on environment variables.
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  _mimeType?: string
): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "vercel_blob") {
    throw new Error("Vercel Blob storage not fully implemented yet.");
  } 
  
  if (provider === "s3") {
    // ponytail: dynamically import S3Client to prevent bundler size bloat in non-S3 environments
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT_URL!,
      region: process.env.AWS_REGION || "ap-southeast",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileName,
        Body: fileBuffer,
        ContentType: _mimeType,
      })
    );

    // ponytail: InsForge storage endpoint is https://{id}.{region}.insforge.app/storage/v1/s3
    // Public assets are served at https://{id}.{region}.insforge.app/storage/v1/object/public/{bucket}/{key}
    const endpoint = process.env.S3_ENDPOINT_URL!;
    const publicBase = endpoint.replace(/\/s3\/?$/, "/object/public");
    const url = `${publicBase}/${process.env.AWS_S3_BUCKET}/${fileName}`;
    return { url };
  }

  // Fallback to local disk for development
  // Use UPLOAD_BASE_DIR if set (e.g., absolute path for standalone server), else process.cwd()
  const baseDir = process.env.UPLOAD_BASE_DIR || process.cwd();
  const uploadsDir = path.join(baseDir, "public", "uploads");
  const filePath = path.join(uploadsDir, fileName);
  // Ensure the full directory path exists (e.g. uploads/studio/) before writing
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, fileBuffer);

  return { url: `/uploads/${fileName}` };
}
