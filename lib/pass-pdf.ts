import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import {
  generatePassCardImage,
  passImageToPageSize,
  type FullPassData,
} from "./pass-card-image";

export type { FullPassData };

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const PAGE_MARGIN_PT = 36;

/** Download pass PDF on A4 — pass card at the top, centered horizontally. */
export async function generateFullPassPdf(data: FullPassData): Promise<Buffer> {
  const pngBuffer = await generatePassCardImage(data);
  const meta = await sharp(pngBuffer).metadata();
  const widthPx = meta.width ?? 0;
  const heightPx = meta.height ?? 0;

  const { widthPt, heightPt } = passImageToPageSize(widthPx, heightPx);

  const jpegBuffer = await sharp(pngBuffer)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 94 })
    .toBuffer();

  const doc = await PDFDocument.create();
  const page = doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
  const image = await doc.embedJpg(jpegBuffer);

  const x = (A4_WIDTH_PT - widthPt) / 2;
  const y = A4_HEIGHT_PT - heightPt - PAGE_MARGIN_PT;
  page.drawImage(image, { x, y, width: widthPt, height: heightPt });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
