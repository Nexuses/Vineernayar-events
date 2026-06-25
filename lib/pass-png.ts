import sharp from "sharp";
import QRCode from "qrcode";
import { BRAND_COLOR, BRAND_LOGO_URL } from "@/lib/constants";

type PassData = {
  firstName: string;
  surname: string;
  designation: string;
  uniqueCode: string;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Use ASCII-safe chars for pass text so it renders on servers without full Unicode fonts (e.g. Vercel). */
function safePassText(s: string): string {
  if (!s || !s.trim()) return "-";
  return s
    .replace(/\u2014/g, "-")   // em dash
    .replace(/\u2013/g, "-")   // en dash
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
}

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Pass card: exactly 58mm × 40mm. Match print pass layout (p-2, logo h-8, name 13px, designation 11px, QR 80px, code 8px).
export const PASS_WIDTH_MM = 58;
export const PASS_HEIGHT_MM = 40;

const SCALE = 2;
const CARD_WIDTH = 672 * SCALE;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (PASS_HEIGHT_MM / PASS_WIDTH_MM));

// Match print pass with increased text sizes.
const PADDING = 25 * SCALE;       // ~8px
const COL_GAP = 25 * SCALE;       // 8px between left col and QR
const LOGO_HEIGHT = 98 * SCALE;   // 32px
const FONT_FIRST = 54 * SCALE; // ~18px
const FONT_LAST = 54 * SCALE; // same as first name
const FONT_COMPANY = 38 * SCALE; // ~12.7px
const FONT_CODE = 24 * SCALE;     // 8px
const LINE_GAP = 9 * SCALE;       // tighter gap between first and last name

const QR_SIZE = 245 * SCALE;      // ~80px in print
const QR_BORDER = 2 * SCALE;
const QR_PADDING = 6 * SCALE;     // ~2px (p-0.5)
const QR_BOX_W = QR_SIZE + QR_PADDING * 2 + QR_BORDER * 2;
const QR_BOX_LEFT = CARD_WIDTH - PADDING - QR_BOX_W;
const QR_IMAGE_LEFT = QR_BOX_LEFT + QR_PADDING + QR_BORDER;
const CODE_GAP = 12 * SCALE;      // 4px (mt-1) above code text

export async function generatePassPng(data: PassData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data.uniqueCode, { width: QR_SIZE, margin: 2, type: "png" });
  const qrResized = await sharp(qrBuffer).resize(QR_SIZE, QR_SIZE).toBuffer();

  let logoBuffer: Buffer | null = null;
  try {
    const res = await fetch(BRAND_LOGO_URL);
    if (res.ok) {
      const arr = await res.arrayBuffer();
      logoBuffer = Buffer.from(arr);
    }
  } catch {
    // ignore
  }

  const yLogoBottom = PADDING + LOGO_HEIGHT;
  const yFirstName = yLogoBottom + LINE_GAP + FONT_FIRST;
  const yLastName = yFirstName + LINE_GAP + FONT_LAST;
  const LINE_GAP_23_EXTRA = 3 * SCALE; // extra space below last name
  const yCompany = yLastName + (LINE_GAP + LINE_GAP_23_EXTRA) + FONT_COMPANY;

  // Vertically center the barcode (QR box + code) on the card
  const qrBlockHeight = QR_BOX_W + CODE_GAP + FONT_CODE;
  const QR_TOP = Math.round((CARD_HEIGHT - qrBlockHeight) / 2);
  const yCode = QR_TOP + QR_BOX_W + CODE_GAP + FONT_CODE;

  // Font stack that exists on Linux/serverless (Vercel); Arial/Courier often missing and cause □ glyphs
  const fontSans = "Helvetica, Arial, sans-serif";
  const fontMono = "Helvetica, Arial, sans-serif";
  const firstNameText = escapeXml(safePassText(capitalizeFirst(data.firstName)));
  const lastNameText = escapeXml(safePassText(capitalizeFirst(data.surname)));
  const companyText = escapeXml(safePassText(data.designation || "-").toUpperCase());
  const codeText = escapeXml(safePassText(data.uniqueCode));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="${PADDING}" y="${yFirstName}" font-family="${fontSans}" font-size="${FONT_FIRST}" font-weight="bold" fill="#18181b">${firstNameText}</text>
  <text x="${PADDING}" y="${yLastName}" font-family="${fontSans}" font-size="${FONT_LAST}" font-weight="bold" fill="#18181b">${lastNameText}</text>
  <text x="${PADDING}" y="${yCompany}" font-family="${fontSans}" font-size="${FONT_COMPANY}" fill="#18181b">${companyText}</text>
  <rect x="${QR_BOX_LEFT}" y="${QR_TOP}" width="${QR_BOX_W}" height="${QR_BOX_W}" rx="4" ry="4" fill="none" stroke="${BRAND_COLOR}" stroke-width="${QR_BORDER}"/>
  <text x="${QR_BOX_LEFT + QR_BOX_W / 2}" y="${yCode}" font-family="${fontMono}" font-size="${FONT_CODE}" font-weight="bold" fill="#18181b" text-anchor="middle">${codeText}</text>
</svg>`.trim();

  const baseImage = await sharp(Buffer.from(svg)).png().toBuffer();
  const composites: sharp.OverlayOptions[] = [
    { input: qrResized, left: QR_IMAGE_LEFT, top: QR_TOP + QR_PADDING + QR_BORDER },
  ];
  if (logoBuffer && logoBuffer.length > 0) {
    const logoResized = await sharp(logoBuffer)
      .resize(undefined, LOGO_HEIGHT)
      .toBuffer();
    composites.push({ input: logoResized, left: PADDING, top: PADDING });
  }

  const composed = await sharp(baseImage)
    .composite(composites)
    .resize(CARD_WIDTH, CARD_HEIGHT)
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 6 })
    .toBuffer();
  return composed;
}
