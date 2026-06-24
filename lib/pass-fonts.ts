import fs from "fs";
import os from "os";
import path from "path";
import { PASS_FONT_BOLD_BASE64, PASS_FONT_REGULAR_BASE64 } from "./pass-font-data";

const FONT_FILES = {
  regular: "roboto-latin-400-normal.woff",
  bold: "roboto-latin-700-normal.woff",
} as const;

let cachedFontDir: string | null = null;

/** Write embedded fonts to a temp dir so resvg can load them on Vercel/Linux. */
function ensurePassFontDir(): string {
  if (cachedFontDir) return cachedFontDir;

  const dir = path.join(os.tmpdir(), "vn-pass-fonts");
  const regularPath = path.join(dir, FONT_FILES.regular);
  const boldPath = path.join(dir, FONT_FILES.bold);

  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(regularPath, Buffer.from(PASS_FONT_REGULAR_BASE64, "base64"));
    fs.writeFileSync(boldPath, Buffer.from(PASS_FONT_BOLD_BASE64, "base64"));
  }

  cachedFontDir = dir;
  return dir;
}

export function getPassFontDir(): string {
  return ensurePassFontDir();
}

export function getPassFontFiles(): string[] {
  const dir = ensurePassFontDir();
  return [path.join(dir, FONT_FILES.regular), path.join(dir, FONT_FILES.bold)];
}

export const PASS_FONT_FAMILY = "Roboto";
