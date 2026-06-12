import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function extFromMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

export async function saveBannerFile(file: File): Promise<string> {
  if (!file || file.size <= 0) return "";
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed for banner upload.");
  }
  if (file.size > MAX_BANNER_SIZE_BYTES) {
    throw new Error("Banner image is too large. Maximum allowed size is 5MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || extFromMime(file.type);
  const filename = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  // Most deployments (Vercel/serverless) cannot reliably persist files written at runtime
  // to `public/` so the browser may get 404.
  //
  // To guarantee the banner always renders, store as a data URL in the DB.
  // (Local dev still works the same way.)
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
