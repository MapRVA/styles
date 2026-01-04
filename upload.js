import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import { lookup } from "mime-types";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing required environment variables:");
  console.error("  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath, baseDir)));
    } else {
      files.push({
        path: fullPath,
        key: relative(baseDir, fullPath),
      });
    }
  }

  return files;
}

async function uploadFile(filePath, key) {
  const content = await readFile(filePath);
  const contentType = lookup(filePath) || "application/octet-stream";

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: contentType,
  });

  await client.send(command);
  console.log(`Uploaded: ${key} (${contentType})`);
}

async function upload() {
  const publicDir = join(import.meta.dirname, "public");

  try {
    await stat(publicDir);
  } catch {
    console.error("public/ directory does not exist. Run the build script first.");
    process.exit(1);
  }

  const files = await getAllFiles(publicDir);

  if (files.length === 0) {
    console.log("No files to upload.");
    return;
  }

  console.log(`Uploading ${files.length} files to R2 bucket: ${R2_BUCKET_NAME}`);

  for (const file of files) {
    await uploadFile(file.path, file.key);
  }

  console.log("Upload complete.");
}

upload().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
