import sharp from "sharp";
import QRCode from "qrcode";
import { formatEventDate, formatRegisteredDate, getEventTimeDisplay } from "./date-utils";
import { BRAND_COLOR, BRAND_LOGO_URL, BRAND_NAME } from "./constants";
import { PASS_FONT_FAMILY } from "./pass-fonts";
import { renderPassSvgToPng } from "./pass-svg-render";

export type FullPassData = {
  firstName: string;
  surname: string;
  email: string;
  mobileNumber: string;
  eventName: string;
  eventStartDate: Date | string;
  eventEndDate?: Date | string;
  eventTime?: string;
  venue: string;
  uniqueCode: string;
  createdAt: Date | string;
};

/** Matches on-screen pass: max-w-xl = 576px */
export const PASS_CARD_WIDTH_PX = 576;
const SCALE = 2;
const W = PASS_CARD_WIDTH_PX * SCALE;

const PAD = 16 * SCALE;
const HEADER_H = 36 * SCALE;
const FOOTER_H = 32 * SCALE;
const LOGO_H = 56 * SCALE;
const QR_SIZE = 112 * SCALE;
const QR_BORDER = 2 * SCALE;
const QR_PAD = 4 * SCALE;
const QR_BOX = QR_SIZE + (QR_PAD + QR_BORDER) * 2;
const COL_GAP = 12 * SCALE;
const LEFT_COL_W = W - PAD * 2 - COL_GAP - QR_BOX;

const R_CARD = 16 * SCALE;
const R_EVENT = 12 * SCALE;
const R_QR = 8 * SCALE;
const ICON_SIZE = 16 * SCALE;
const ICON_COL_GAP = 10 * SCALE;
const EVENT_BOX_BOTTOM_GAP = 10 * SCALE;

const ICON_CALENDAR =
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const ICON_CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const ICON_MAP_PIN = [
  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
];

const FONT_SANS = PASS_FONT_FAMILY;
const FONT_MONO = PASS_FONT_FAMILY;

const C = {
  black: "#18181b",
  zinc700: "#3f3f46",
  zinc600: "#52525b",
  zinc500: "#71717a",
  zinc200: "#e4e4e7",
  zinc100: "#f4f4f5",
  brand: BRAND_COLOR,
  brandTint: "#fefce8",
  brandBorder: "#ebe08d",
  white: "#ffffff",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeText(s: string): string {
  return (s || "")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
}

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function wrapLines(text: string, fontSize: number, maxWidth: number): string[] {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return ["—"];
  const lines: string[] = [];
  let line = "";
  const charW = fontSize * 0.5;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * charW <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svgText(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  opts: {
    bold?: boolean;
    fill?: string;
    mono?: boolean;
    anchor?: "start" | "end";
    letterSpacing?: number;
    baseline?: "hanging" | "central";
  } = {}
): string {
  const weight = opts.bold ? ' font-weight="700"' : "";
  const family = opts.mono ? FONT_MONO : FONT_SANS;
  const anchor = opts.anchor ? ` text-anchor="${opts.anchor}"` : "";
  const ls = opts.letterSpacing ? ` letter-spacing="${opts.letterSpacing}"` : "";
  const baseline = opts.baseline ?? "hanging";
  return `<text x="${x}" y="${y}" dominant-baseline="${baseline}" font-family="${family}" font-size="${fontSize}"${weight} fill="${opts.fill ?? C.black}"${anchor}${ls}>${escapeXml(text)}</text>`;
}

function svgTextBlock(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  opts: { bold?: boolean; fill?: string } = {}
): { svg: string; height: number } {
  const svg = lines
    .map((line, i) => svgText(x, y + i * lineHeight, line, fontSize, opts))
    .join("\n");
  return { svg, height: lines.length * lineHeight };
}

function svgHeroIcon(paths: string | string[], x: number, y: number): string {
  const pathList = Array.isArray(paths) ? paths : [paths];
  const iconScale = ICON_SIZE / 24;
  const pathEls = pathList
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${C.zinc500}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("");
  return `<g transform="translate(${x}, ${y}) scale(${iconScale})">${pathEls}</g>`;
}

function svgDetailRow(
  iconPaths: string | string[],
  lines: string[],
  iconX: number,
  textX: number,
  rowY: number,
  fontSize: number,
  lineHeight: number
): { svg: string; height: number } {
  const textHeight = lines.length * lineHeight;
  const rowH = Math.max(ICON_SIZE, textHeight);
  const iconY = rowY + Math.round((rowH - ICON_SIZE) / 2);
  const parts: string[] = [svgHeroIcon(iconPaths, iconX, iconY)];

  if (lines.length === 1) {
    parts.push(
      svgText(textX, rowY + rowH / 2, lines[0]!, fontSize, {
        baseline: "central",
      })
    );
  } else {
    parts.push(svgTextBlock(lines, textX, rowY, fontSize, lineHeight).svg);
  }

  return { svg: parts.join("\n"), height: rowH };
}

async function fetchLogo(): Promise<Buffer | null> {
  try {
    const res = await fetch(BRAND_LOGO_URL);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Raster pass card image — layout aligned with the on-screen pass. */
export async function generatePassCardImage(data: FullPassData): Promise<Buffer> {
  const firstName = capitalizeFirst(data.firstName);
  const surname = capitalizeFirst(data.surname);
  const eventDate = formatEventDate(data.eventStartDate);
  const eventTime = getEventTimeDisplay(data);
  const venue = data.venue || "—";
  const registered = `Registered ${formatRegisteredDate(data.createdAt)}`;
  const logoBuffer = await fetchLogo();

  const fsHeader = 11 * SCALE;
  const fsWelcome = 12 * SCALE;
  const fsName = 20 * SCALE;
  const fsBody = 14 * SCALE;
  const fsEventTitle = 16 * SCALE;
  const fsEventRow = 14 * SCALE;
  const fsFooter = 11 * SCALE;

  const lhName = Math.round(fsName * 1.25);
  const lhBody = Math.round(fsBody * 1.35);
  const lhEventTitle = Math.round(fsEventTitle * 1.3);
  const lhEventRow = Math.round(fsEventRow * 1.35);

  const nameLines = wrapLines(`${firstName} ${surname}`, fsName, LEFT_COL_W);
  const emailLines = wrapLines(data.email, fsBody, LEFT_COL_W);
  const eventInnerW = W - PAD * 2 - 24 * SCALE;
  const eventRowTextW = eventInnerW - ICON_SIZE - ICON_COL_GAP;
  const eventNameLines = wrapLines(data.eventName, fsEventTitle, eventInnerW);
  const dateLines = wrapLines(eventDate, fsEventRow, eventRowTextW);
  const timeLines = wrapLines(eventTime, fsEventRow, eventRowTextW);
  const venueLines = wrapLines(venue, fsEventRow, eventRowTextW);

  const leftColH =
    LOGO_H +
    8 * SCALE +
    fsWelcome +
    2 * SCALE +
    nameLines.length * lhName +
    6 * SCALE +
    lhBody +
    4 * SCALE +
    emailLines.length * lhBody;

  const topRowH = Math.max(leftColH, QR_BOX);
  const eventBoxPad = 12 * SCALE;
  const eventRowGap = 8 * SCALE;

  const detailRowH = (lines: string[]) => Math.max(ICON_SIZE, lines.length * lhEventRow);

  const eventBoxH =
    eventBoxPad +
    eventNameLines.length * lhEventTitle +
    10 * SCALE +
    detailRowH(dateLines) +
    eventRowGap +
    detailRowH(timeLines) +
    eventRowGap +
    detailRowH(venueLines) +
    eventBoxPad;

  const cardH =
    HEADER_H + PAD + topRowH + 12 * SCALE + eventBoxH + EVENT_BOX_BOTTOM_GAP + FOOTER_H;

  const bodyTop = HEADER_H + PAD;
  const qrX = W - PAD - QR_BOX;
  const qrImgX = qrX + QR_BORDER + QR_PAD;
  const qrImgY = bodyTop + QR_BORDER + QR_PAD;
  const leftX = PAD;

  const svgParts: string[] = [];

  svgParts.push(`<defs><clipPath id="card"><rect width="${W}" height="${cardH}" rx="${R_CARD}" ry="${R_CARD}"/></clipPath></defs>`);
  svgParts.push(`<g clip-path="url(#card)">`);

  svgParts.push(`<rect width="${W}" height="${cardH}" fill="${C.white}"/>`);
  svgParts.push(`<rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="${C.brand}"/>`);
  svgParts.push(
    svgText(PAD, Math.round((HEADER_H - fsHeader) / 2), "Event Pass", fsHeader, {
      bold: true,
      letterSpacing: 3.5 * SCALE,
    })
  );
  svgParts.push(
    svgText(W - PAD, Math.round((HEADER_H - fsHeader) / 2), safeText(data.uniqueCode), fsHeader, {
      bold: true,
      mono: true,
      anchor: "end",
    })
  );

  let y = bodyTop;
  if (!logoBuffer) {
    svgParts.push(svgText(leftX, y, BRAND_NAME, 14 * SCALE, { bold: true }));
    y += Math.round(14 * SCALE * 1.2);
  } else {
    y += LOGO_H;
  }
  y += 8 * SCALE;
  svgParts.push(svgText(leftX, y, "Welcome", fsWelcome, { bold: true, fill: C.zinc500 }));
  y += fsWelcome + 2 * SCALE;

  const nameBlock = svgTextBlock(nameLines, leftX, y, fsName, lhName, { bold: true });
  svgParts.push(nameBlock.svg);
  y += nameBlock.height + 6 * SCALE;

  svgParts.push(svgText(leftX, y, safeText(data.mobileNumber) || "—", fsBody, { fill: C.zinc700 }));
  y += lhBody + 4 * SCALE;

  const emailBlock = svgTextBlock(emailLines, leftX, y, fsBody, lhBody, { fill: C.zinc600 });
  svgParts.push(emailBlock.svg);

  svgParts.push(
    `<rect x="${qrX}" y="${bodyTop}" width="${QR_BOX}" height="${QR_BOX}" rx="${R_QR}" ry="${R_QR}" fill="${C.white}" stroke="${C.brand}" stroke-width="${QR_BORDER}"/>`
  );

  const eventBoxY = bodyTop + topRowH + 12 * SCALE;
  svgParts.push(
    `<rect x="${PAD}" y="${eventBoxY}" width="${W - PAD * 2}" height="${eventBoxH}" rx="${R_EVENT}" ry="${R_EVENT}" fill="${C.brandTint}" stroke="${C.brandBorder}" stroke-width="${SCALE}"/>`
  );

  let ey = eventBoxY + eventBoxPad;
  const eventTextX = PAD + eventBoxPad;
  const iconX = eventTextX;
  const textX = iconX + ICON_SIZE + ICON_COL_GAP;

  const titleBlock = svgTextBlock(eventNameLines, eventTextX, ey, fsEventTitle, lhEventTitle, {
    bold: true,
  });
  svgParts.push(titleBlock.svg);
  ey += titleBlock.height + 10 * SCALE;

  const rowIcons = [ICON_CALENDAR, ICON_CLOCK, ICON_MAP_PIN];
  const rowSets = [dateLines, timeLines, venueLines];
  for (let i = 0; i < rowSets.length; i++) {
    const lines = rowSets[i]!;
    const row = svgDetailRow(rowIcons[i]!, lines, iconX, textX, ey, fsEventRow, lhEventRow);
    svgParts.push(row.svg);
    ey += row.height + (i < rowSets.length - 1 ? eventRowGap : 0);
  }

  const footerY = cardH - FOOTER_H;
  svgParts.push(`<rect x="0" y="${footerY}" width="${W}" height="${FOOTER_H}" fill="${C.zinc100}"/>`);
  svgParts.push(`<line x1="0" y1="${footerY}" x2="${W}" y2="${footerY}" stroke="${C.zinc200}" stroke-width="${SCALE}"/>`);
  svgParts.push(
    svgText(PAD, footerY + Math.round((FOOTER_H - fsFooter) / 2), registered, fsFooter, {
      fill: C.zinc500,
    })
  );

  svgParts.push(`</g>`);
  svgParts.push(
    `<rect width="${W}" height="${cardH}" rx="${R_CARD}" ry="${R_CARD}" fill="none" stroke="${C.zinc200}" stroke-width="${SCALE}"/>`
  );

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${cardH}" viewBox="0 0 ${W} ${cardH}">
${svgParts.join("\n")}
</svg>`;

  const qrBuffer = await QRCode.toBuffer(data.uniqueCode, { width: QR_SIZE, margin: 1, type: "png" });
  const qrResized = await sharp(qrBuffer).resize(QR_SIZE, QR_SIZE).toBuffer();

  let base = renderPassSvgToPng(svg);
  const composites: sharp.OverlayOptions[] = [{ input: qrResized, left: qrImgX, top: qrImgY }];

  if (logoBuffer?.length) {
    const logoResized = await sharp(logoBuffer).resize({ height: LOGO_H }).toBuffer();
    composites.push({ input: logoResized, left: leftX, top: bodyTop });
  }

  base = await sharp(base).composite(composites).flatten({ background: C.white }).png().toBuffer();
  return base;
}

export function passImageToPageSize(widthPx: number, heightPx: number): { widthPt: number; heightPt: number } {
  const ptPerPx = 72 / 96;
  return {
    widthPt: (widthPx / SCALE) * ptPerPx,
    heightPt: (heightPx / SCALE) * ptPerPx,
  };
}

export { SCALE as PASS_CARD_SCALE };
