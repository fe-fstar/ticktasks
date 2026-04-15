import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { lookup } from "node:dns/promises";

// Load environment variables
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "ticktasks";

// Validate environment variables
if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   R2_ACCOUNT_ID:", ACCOUNT_ID ? "✓" : "✗");
  console.error("   R2_ACCESS_KEY_ID:", ACCESS_KEY_ID ? "✓" : "✗");
  console.error("   R2_SECRET_ACCESS_KEY:", SECRET_ACCESS_KEY ? "✓" : "✗");
  process.exit(1);
}

// Initialize S3 client for R2
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".html": "text/html",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json",
};

function getContentType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

// Recursively get all files in a directory
async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// Delete all objects with a given prefix
async function deleteFolder(prefix: string): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listResponse = await S3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      await S3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
          },
        })
      );
      deleted += listResponse.Contents.length;
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  return deleted;
}

// Upload a single file to R2
async function uploadFile(localPath: string, remotePath: string): Promise<void> {
  const fileContent = await readFile(localPath);
  const contentType = getContentType(localPath);

  await S3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: remotePath,
      Body: fileContent,
      ContentType: contentType,
    })
  );
}

// Main function
async function main() {
  const nextDir = join(process.cwd(), ".next", "static");

  console.log("🚀 Starting upload to R2...");
  console.log(`📁 Source: ${nextDir}`);
  console.log(`🪣 Bucket: ${BUCKET_NAME}`);
  console.log(`🔑 Account: ${ACCOUNT_ID}`);
  console.log();

  try {
    // Delete existing files in ticktasks folder
    console.log("🗑️  Deleting existing files in ticktasks/...");
    const deletedCount = await deleteFolder("ticktasks/");
    console.log(`✓ Deleted ${deletedCount} existing files\n`);

    // Get all files in .next/static directory
    const files = await getAllFiles(nextDir);
    console.log(`📦 Found ${files.length} files to upload\n`);

    let uploaded = 0;
    let failed = 0;

    // Upload each file
    for (const filePath of files) {
      const relativePath = relative(process.cwd(), filePath);
      const remotePath = `ticktasks/${relativePath.replace(/\\/g, "/").replace(".next", "_next")}`;

      try {
        await uploadFile(filePath, remotePath);
        uploaded++;
        console.log(`✓ ${relativePath}`);
      } catch (error) {
        failed++;
        console.error(`✗ ${relativePath}`);
        console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log();
    console.log("═".repeat(50));
    console.log(`✅ Upload complete!`);
    console.log(`   Uploaded: ${uploaded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${files.length}`);
    console.log("═".repeat(50));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Upload failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
