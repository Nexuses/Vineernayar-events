import fs from "fs";
import path from "path";

const FONT_FILES = {
  regular: "inter-latin-400-normal.woff",
  bold: "inter-latin-700-normal.woff",
} as const;

let cachedDefs: string | null = null;

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

function loadFontBase64(filename: string): string {
  return fs.readFileSync(resolveFontPath(filename)).toString("base64");
}

/** Embedded @font-face rules for Sharp/librsvg SVG rasterization on Linux (Vercel). */
export function getPassSvgFontDefs(): string {
  if (cachedDefs) return cachedDefs;

  const regular = loadFontBase64(FONT_FILES.regular);
  const bold = loadFontBase64(FONT_FILES.bold);

  cachedDefs = `<style type="text/css"><![CDATA[
    @font-face {
      font-family: 'PassSans';
      font-style: normal;
      font-weight: 400;
      src: url('data:font/woff;base64,${regular}') format('woff');
    }
    @font-face {
      font-family: 'PassSans';
      font-style: normal;
      font-weight: 700;
      src: url('data:font/woff;base64,${bold}') format('woff');
    }
  ]]></style>`;

  return cachedDefs;
}

export const PASS_FONT_FAMILY = "PassSans, sans-serif";
