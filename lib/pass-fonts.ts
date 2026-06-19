import fs from "fs";
import path from "path";

const FONT_FILES = {
  regular: "inter-latin-400-normal.woff",
  bold: "inter-latin-700-normal.woff",
} as const;

let cachedFontFiles: string[] | null = null;

function resolveFontPath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), "lib/fonts", filename),
    path.join(process.cwd(), "node_modules/@fontsource/inter/files", filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Pass font not found: ${filename}`);
}

/** Absolute paths to Inter font files for @resvg/resvg-js. */
export function getPassFontFiles(): string[] {
  if (cachedFontFiles) return cachedFontFiles;
  cachedFontFiles = [resolveFontPath(FONT_FILES.regular), resolveFontPath(FONT_FILES.bold)];
  return cachedFontFiles;
}

export const PASS_FONT_FAMILY = "Inter, sans-serif";
