import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
import { PASS_WIDTH_MM, PASS_HEIGHT_MM } from "./pass-png";

const PT_PER_MM = 72 / 25.4;

/**
 * Put the pass into a 58mm × 40mm PDF page with an exact-size border, scaled to fit and centered.
 * Embeds as JPEG (no alpha) to avoid blue overlay in Gmail's PDF viewer.
 */
export async function pngPassToPdf(pngBuffer: Buffer): Promise<Buffer> {
  const widthPt = PASS_WIDTH_MM * PT_PER_MM;
  const heightPt = PASS_HEIGHT_MM * PT_PER_MM;

  const jpegBuffer = await sharp(pngBuffer)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([widthPt, heightPt]);

  const image = await pdfDoc.embedJpg(jpegBuffer);
  const { width: drawWidth, height: drawHeight } = image.scaleToFit(widthPt, heightPt);
  const x = (widthPt - drawWidth) / 2;
  const y = (heightPt - drawHeight) / 2;
  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
