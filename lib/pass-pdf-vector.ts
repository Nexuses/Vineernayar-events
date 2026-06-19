import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { BRAND_COLOR, BRAND_LOGO_URL, BRAND_NAME } from "./constants";
import { formatEventDate, formatRegisteredDate, getEventTimeDisplay } from "./date-utils";
import { PASS_FONT_BOLD_BASE64, PASS_FONT_REGULAR_BASE64 } from "./pass-font-data";
import type { FullPassData } from "./pass-card-image";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 36;

const PT = (px: number) => px * 0.75;

const W = PT(576);
const PAD = PT(16);
const HEADER_H = PT(36);
const FOOTER_H = PT(32);
const LOGO_H = PT(56);
const QR_SIZE = PT(112);
const QR_BORDER = PT(2);
const QR_PAD = PT(4);
const QR_BOX = QR_SIZE + (QR_PAD + QR_BORDER) * 2;
const COL_GAP = PT(12);
const LEFT_COL_W = W - PAD * 2 - COL_GAP - QR_BOX;
const R_CARD = PT(16);

const C = {
  black: rgb(0.09, 0.09, 0.11),
  zinc700: rgb(0.25, 0.25, 0.27),
  zinc600: rgb(0.32, 0.32, 0.35),
  zinc500: rgb(0.44, 0.44, 0.48),
  zinc200: rgb(0.89, 0.89, 0.91),
  zinc100: rgb(0.96, 0.96, 0.96),
  brand: rgb(0.973, 0.91, 0.157),
  brandTint: rgb(0.996, 0.988, 0.91),
  brandBorder: rgb(0.92, 0.88, 0.55),
  white: rgb(1, 1, 1),
};

function safeText(s: string): string {
  return (s || "")
    .replace(/\u2122/g, "")
    .replace(/\u00AE/g, "")
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

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return ["—"];

  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function fetchLogo(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(BRAND_LOGO_URL);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

type PassFonts = { regular: PDFFont; bold: PDFFont };

function drawWrappedText(
  page: PDFPage,
  lines: string[],
  x: number,
  yTop: number,
  size: number,
  lineHeight: number,
  font: PDFFont,
  color = C.black
): number {
  let y = yTop;
  for (const line of lines) {
    y -= lineHeight;
    page.drawText(line, { x, y: y + (lineHeight - size) * 0.35, size, font, color });
  }
  return yTop - lines.length * lineHeight;
}

function roundedRectSvg(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h - radius}`,
    `Q ${x + w} ${y + h} ${x + w - radius} ${y + h}`,
    `L ${x + radius} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - radius}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join(" ");
}

function topRoundedBarSvg(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    "Z",
  ].join(" ");
}

function bottomRoundedBarSvg(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  return [
    `M ${x} ${y + h - radius}`,
    `Q ${x} ${y + h} ${x + radius} ${y + h}`,
    `L ${x + w - radius} ${y + h}`,
    `Q ${x + w} ${y + h} ${x + w} ${y + h - radius}`,
    `L ${x + w} ${y}`,
    `L ${x} ${y}`,
    "Z",
  ].join(" ");
}

/** Draw pass card with pdf-lib + embedded fonts (reliable on Vercel; no SVG rasterization). */
export async function generateVectorPassPdf(data: FullPassData): Promise<Buffer> {
  const firstName = capitalizeFirst(data.firstName);
  const surname = capitalizeFirst(data.surname);
  const eventDate = formatEventDate(data.eventStartDate);
  const eventTime = getEventTimeDisplay(data);
  const venue = data.venue || "—";
  const registered = `Registered ${formatRegisteredDate(data.createdAt)}`;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(Buffer.from(PASS_FONT_REGULAR_BASE64, "base64"));
  const bold = await doc.embedFont(Buffer.from(PASS_FONT_BOLD_BASE64, "base64"));

  const fsHeader = PT(11);
  const fsWelcome = PT(12);
  const fsName = PT(20);
  const fsBody = PT(14);
  const fsEventTitle = PT(16);
  const fsEventRow = PT(14);
  const fsFooter = PT(11);

  const lhName = fsName * 1.25;
  const lhBody = fsBody * 1.35;
  const lhEventTitle = fsEventTitle * 1.3;
  const lhEventRow = fsEventRow * 1.35;

  const nameLines = wrapLines(`${firstName} ${surname}`, bold, fsName, LEFT_COL_W);
  const emailLines = wrapLines(data.email, regular, fsBody, LEFT_COL_W);
  const eventInnerW = W - PAD * 2 - PT(24);
  const eventNameLines = wrapLines(data.eventName, bold, fsEventTitle, eventInnerW);
  const dateLines = wrapLines(eventDate, regular, fsEventRow, eventInnerW - PT(24));
  const timeLines = wrapLines(eventTime, regular, fsEventRow, eventInnerW - PT(24));
  const venueLines = wrapLines(venue, regular, fsEventRow, eventInnerW - PT(24));

  const leftColH =
    LOGO_H +
    PT(8) +
    fsWelcome +
    PT(2) +
    nameLines.length * lhName +
    PT(6) +
    lhBody +
    PT(4) +
    emailLines.length * lhBody;

  const topRowH = Math.max(leftColH, QR_BOX);
  const eventBoxPad = PT(12);
  const eventRowGap = PT(8);
  const detailRowH = (lines: string[]) => Math.max(PT(16), lines.length * lhEventRow);

  const eventBoxH =
    eventBoxPad +
    eventNameLines.length * lhEventTitle +
    PT(10) +
    detailRowH(dateLines) +
    eventRowGap +
    detailRowH(timeLines) +
    eventRowGap +
    detailRowH(venueLines) +
    eventBoxPad;

  const cardH = HEADER_H + PAD + topRowH + PT(12) + eventBoxH + PT(10) + FOOTER_H;

  const page = doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
  const cardX = (A4_WIDTH_PT - W) / 2;
  const cardBottom = A4_HEIGHT_PT - PAGE_MARGIN_PT - cardH;
  const cardTop = cardBottom + cardH;

  page.drawSvgPath(roundedRectSvg(cardX, cardBottom, W, cardH, R_CARD), { color: C.white });
  page.drawSvgPath(topRoundedBarSvg(cardX, cardTop - HEADER_H, W, HEADER_H, R_CARD), { color: C.brand });

  const headerTextY = cardTop - HEADER_H + (HEADER_H - fsHeader) / 2;
  page.drawText("Event Pass", {
    x: cardX + PAD,
    y: headerTextY,
    size: fsHeader,
    font: bold,
    color: C.black,
  });
  const codeText = safeText(data.uniqueCode);
  page.drawText(codeText, {
    x: cardX + W - PAD - bold.widthOfTextAtSize(codeText, fsHeader),
    y: headerTextY,
    size: fsHeader,
    font: bold,
    color: C.black,
  });

  const bodyTop = cardTop - HEADER_H - PAD;
  const leftX = cardX + PAD;
  const qrX = cardX + W - PAD - QR_BOX;

  const logoBytes = await fetchLogo();
  let contentY = bodyTop;

  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const logoScale = LOGO_H / logo.height;
      const logoW = logo.width * logoScale;
      page.drawImage(logo, {
        x: leftX,
        y: bodyTop - LOGO_H,
        width: logoW,
        height: LOGO_H,
      });
      contentY = bodyTop - LOGO_H;
    } catch {
      page.drawText(BRAND_NAME, { x: leftX, y: bodyTop - PT(14), size: PT(14), font: bold, color: C.black });
      contentY = bodyTop - PT(17);
    }
  } else {
    page.drawText(BRAND_NAME, { x: leftX, y: bodyTop - PT(14), size: PT(14), font: bold, color: C.black });
    contentY = bodyTop - PT(17);
  }

  contentY -= PT(8);
  page.drawText("Welcome", { x: leftX, y: contentY - fsWelcome, size: fsWelcome, font: bold, color: C.zinc500 });
  contentY -= fsWelcome + PT(2);
  contentY = drawWrappedText(page, nameLines, leftX, contentY, fsName, lhName, bold);
  contentY -= PT(6);
  page.drawText(safeText(data.mobileNumber) || "—", {
    x: leftX,
    y: contentY - fsBody,
    size: fsBody,
    font: regular,
    color: C.zinc700,
  });
  contentY -= lhBody + PT(4);
  drawWrappedText(page, emailLines, leftX, contentY, fsBody, lhBody, regular, C.zinc600);

  const qrBuffer = await QRCode.toBuffer(data.uniqueCode, { width: 280, margin: 1, type: "png" });
  const qrImage = await doc.embedPng(qrBuffer);
  const qrImgX = qrX + QR_BORDER + QR_PAD;
  const qrImgY = bodyTop - QR_BORDER - QR_PAD - QR_SIZE;
  page.drawRectangle({
    x: qrX,
    y: bodyTop - QR_BOX,
    width: QR_BOX,
    height: QR_BOX,
    color: C.white,
    borderColor: C.brand,
    borderWidth: QR_BORDER,
  });
  page.drawImage(qrImage, { x: qrImgX, y: qrImgY, width: QR_SIZE, height: QR_SIZE });

  const eventBoxY = bodyTop - topRowH - PT(12);
  const eventBoxBottom = eventBoxY - eventBoxH;
  page.drawRectangle({
    x: cardX + PAD,
    y: eventBoxBottom,
    width: W - PAD * 2,
    height: eventBoxH,
    color: C.brandTint,
    borderColor: C.brandBorder,
    borderWidth: PT(1),
  });

  let ey = eventBoxY - eventBoxPad;
  const eventTextX = cardX + PAD + eventBoxPad;
  ey = drawWrappedText(page, eventNameLines, eventTextX, ey, fsEventTitle, lhEventTitle, bold);
  ey -= PT(10);

  const rowSets = [
    { label: "Date", lines: dateLines },
    { label: "Time", lines: timeLines },
    { label: "Venue", lines: venueLines },
  ];

  for (let i = 0; i < rowSets.length; i++) {
    const row = rowSets[i]!;
    const rowH = detailRowH(row.lines);
    ey -= rowH;
    page.drawText(`${row.label}:`, {
      x: eventTextX,
      y: ey + rowH - fsEventRow,
      size: fsEventRow,
      font: bold,
      color: C.zinc600,
    });
    drawWrappedText(
      page,
      row.lines,
      eventTextX + PT(52),
      ey + rowH,
      fsEventRow,
      lhEventRow,
      regular,
      C.black
    );
    if (i < rowSets.length - 1) ey -= eventRowGap;
  }

  page.drawSvgPath(bottomRoundedBarSvg(cardX, cardBottom, W, FOOTER_H, R_CARD), { color: C.zinc100 });
  page.drawLine({
    start: { x: cardX, y: cardBottom + FOOTER_H },
    end: { x: cardX + W, y: cardBottom + FOOTER_H },
    thickness: PT(1),
    color: C.zinc200,
  });
  page.drawText(registered, {
    x: cardX + PAD,
    y: cardBottom + (FOOTER_H - fsFooter) / 2,
    size: fsFooter,
    font: regular,
    color: C.zinc500,
  });

  page.drawSvgPath(roundedRectSvg(cardX, cardBottom, W, cardH, R_CARD), {
    borderColor: C.zinc200,
    borderWidth: PT(1),
  });

  return Buffer.from(await doc.save());
}
