import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const ENDPOINT = process.env.SUPABASE_S3_ENDPOINT ?? "";
const REGION = process.env.SUPABASE_S3_REGION ?? "us-east-1";
const ACCESS_KEY_ID = process.env.SUPABASE_S3_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY ?? "";
const VIDEOS_BUCKET = process.env.SUPABASE_VIDEOS_BUCKET ?? "videos";

let cachedClient: S3Client | null = null;
let cachedProjectRef: string | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error(
      "Supabase S3 storage not configured. Set SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY.",
    );
  }
  cachedClient = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // required for Supabase / non-AWS S3
  });
  return cachedClient;
}

export function isStorageConfigured(): boolean {
  return Boolean(ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
}

/**
 * Extracts the Supabase project ref from the S3 endpoint and returns the
 * public CDN base URL — e.g. given
 *   https://abc123.storage.supabase.co/storage/v1/s3
 * returns
 *   https://abc123.supabase.co
 */
function getProjectBaseUrl(): string {
  if (cachedProjectRef !== null) return cachedProjectRef;
  const match = /^https:\/\/([^.]+)\.storage\.supabase\.co/.exec(ENDPOINT);
  if (!match) {
    throw new Error(
      `Cannot derive Supabase project ref from SUPABASE_S3_ENDPOINT="${ENDPOINT}".`,
    );
  }
  cachedProjectRef = `https://${match[1]}.supabase.co`;
  return cachedProjectRef;
}

function publicUrlFor(path: string): string {
  return `${getProjectBaseUrl()}/storage/v1/object/public/${VIDEOS_BUCKET}/${path}`;
}

/**
 * Converts `gs://bucket/path` to its HTTPS counterpart on
 * `storage.googleapis.com`. Requires the GCS object to be publicly readable.
 */
function gcsUriToHttp(gcsUri: string): string {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(gcsUri);
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`);
  return `https://storage.googleapis.com/${match[1]}/${match[2]}`;
}

function extensionFor(mimeType: string | undefined): string {
  if (!mimeType) return "mp4";
  const sub = mimeType.split("/")[1];
  return sub ? sub.split(";")[0] : "mp4";
}

export interface UploadResult {
  publicUrl: string;
  path: string;
  bucket: string;
  bytes: number;
}

interface UploadCommon {
  userId: string;
  generationId: string;
  mimeType?: string;
}

async function uploadBuffer(
  data: Buffer,
  opts: UploadCommon,
): Promise<UploadResult> {
  const client = getClient();
  const ext = extensionFor(opts.mimeType);
  const path = `${opts.userId}/${opts.generationId}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: VIDEOS_BUCKET,
      Key: path,
      Body: data,
      ContentType: opts.mimeType ?? "video/mp4",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    publicUrl: publicUrlFor(path),
    path,
    bucket: VIDEOS_BUCKET,
    bytes: data.byteLength,
  };
}

export async function uploadVideoFromUrl(
  sourceUrl: string,
  opts: UploadCommon,
): Promise<UploadResult> {
  const res = await fetch(sourceUrl, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      throw new Error(
        `Source video is not publicly readable (HTTP ${res.status}). ` +
          `If using GCS, grant roles/storage.objectViewer to allUsers on the bucket, ` +
          `or proxy the download through the provider backend. URL: ${sourceUrl}`,
      );
    }
    if (res.status === 404) {
      throw new Error(`Source video not found (HTTP 404): ${sourceUrl}`);
    }
    throw new Error(
      `Failed to fetch source video (HTTP ${res.status}) from ${sourceUrl}`,
    );
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error(`Source video is empty: ${sourceUrl}`);
  }
  return uploadBuffer(buffer, {
    ...opts,
    mimeType: opts.mimeType ?? res.headers.get("content-type") ?? "video/mp4",
  });
}

export async function uploadVideoFromGcs(
  gcsUri: string,
  opts: UploadCommon,
): Promise<UploadResult> {
  return uploadVideoFromUrl(gcsUriToHttp(gcsUri), opts);
}

export async function uploadVideoFromBase64(
  base64: string,
  opts: UploadCommon,
): Promise<UploadResult> {
  const buffer = Buffer.from(base64, "base64");
  return uploadBuffer(buffer, opts);
}

/**
 * Returns a presigned GET URL for a private object. Useful if the bucket
 * is not public. Default TTL: 7 days.
 */
export async function getSignedVideoUrl(
  path: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
): Promise<string> {
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = getClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: VIDEOS_BUCKET, Key: path }),
    { expiresIn: expiresInSeconds },
  );
}
