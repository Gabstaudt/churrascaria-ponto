import "server-only";

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function configuration() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) throw new Error("Cloudflare R2 não configurado. Revise as variáveis R2_* no ambiente.");
  return { bucket, client: new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } }) };
}

export async function createPrivateUploadUrl(key: string, contentType: string) {
  const { bucket, client } = configuration();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 300 });
}

export async function inspectPrivateObject(key: string) {
  const { bucket, client } = configuration();
  const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? "" };
}

export async function createPrivateDownloadUrl(key: string, fileName: string) {
  const { bucket, client } = configuration();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}` }), { expiresIn: 120 });
}

export async function deletePrivateObject(key: string) {
  const { bucket, client } = configuration();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
