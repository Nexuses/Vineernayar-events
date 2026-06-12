import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PT_PER_MM = 72 / 25.4;
export const PASS_WIDTH_MM = 58;
export const PASS_HEIGHT_MM = 40;

export type PassData = {
  firstName: string;
  surname: string;
  organization: string;
  designation: string;
  uniqueCode: string;
};

function safeText(s: string): string {
  if (!s || !s.trim()) return "-";
  return s
    .replace(/\u2122/g, "")        // remove ™ (not in PDF standard fonts, can distort)
    .replace(/\u00AE/g, "")        // remove ®
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

/**
 * Generate the email pass as PDF directly with pdf-lib.
 * Uses PDF standard fonts (Helvetica, Courier) so text renders in all viewers (Gmail, etc.)
 * without relying on server system fonts (which caused □/dots in Sharp SVG→PNG).
 */
export async function generatePassPdf(data: PassData): Promise<Buffer> {
  const widthPt = PASS_WIDTH_MM * PT_PER_MM;
  const heightPt = PASS_HEIGHT_MM * PT_PER_MM;
  const FONT_FIRST = 19; // row 1 (bigger first name)
  const FONT_LAST = 19; // row 2 (same as first name)
  const FONT_COMPANY = 13; // row 3
  const LINE_GAP = 3;
  const LINE_GAP_23_EXTRA = 2; // extra spacing between last name and company

  const doc = await PDFDocument.create();
  const page = doc.addPage([widthPt, heightPt]);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);

  const black = rgb(0.09, 0.09, 0.11);

  // 3-row layout:
  // Row 1: First name ONLY (bold)
  // Row 2: Last name ONLY
  // Row 3: Company ONLY
  const firstStr = safeText(capitalizeFirst(data.firstName));
  const lastStr = safeText(capitalizeFirst(data.surname));
  const companyStr = safeText(data.organization || "-").toUpperCase();

  const row1Width = helveticaBold.widthOfTextAtSize(firstStr, FONT_FIRST);
  const row2Width = helveticaBold.widthOfTextAtSize(lastStr, FONT_LAST);
  const row3Width = helvetica.widthOfTextAtSize(companyStr, FONT_COMPANY);

  const blockHeight = FONT_FIRST + LINE_GAP + FONT_LAST + (LINE_GAP + LINE_GAP_23_EXTRA) + FONT_COMPANY;
  const yRow1Baseline = (heightPt + blockHeight) / 2 - FONT_FIRST;
  const yRow2Baseline = yRow1Baseline - LINE_GAP - FONT_LAST;
  const yRow3Baseline = yRow2Baseline - (LINE_GAP + LINE_GAP_23_EXTRA) - FONT_COMPANY;

  page.drawText(firstStr, {
    x: Math.max(4, (widthPt - row1Width) / 2),
    y: yRow1Baseline,
    size: FONT_FIRST,
    font: helveticaBold,
    color: black,
  });

  page.drawText(lastStr, {
    x: Math.max(4, (widthPt - row2Width) / 2),
    y: yRow2Baseline,
    size: FONT_LAST,
    font: helveticaBold,
    color: black,
  });

  page.drawText(companyStr, {
    x: Math.max(4, (widthPt - row3Width) / 2),
    y: yRow3Baseline,
    size: FONT_COMPANY,
    font: helvetica,
    color: black,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
