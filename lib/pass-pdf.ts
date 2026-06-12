import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { formatEventDateTime } from "./date-utils";
import { BRAND_NAME } from "./constants";

type PassData = {
  firstName: string;
  surname: string;
  email: string;
  mobileNumber: string;
  eventName: string;
  eventStartDate: Date | string;
  eventEndDate: Date | string;
  venue: string;
  uniqueCode: string;
  createdAt: Date | string;
};

function formatRegisteredDate(d: Date | string): string {
  if (!d) return "—";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19);
}

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export async function generatePassPdf(data: PassData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data.uniqueCode, { width: 140, margin: 2 });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const cardWidth = 400;
    const cardX = (612 - cardWidth) / 2;

    doc.rect(cardX, 80, cardWidth, 320).stroke();
    doc.fontSize(10).fillColor("#18181b").text(BRAND_NAME, cardX + 20, 100);
    doc.fontSize(11).fillColor("#18181b").text("Welcome,", cardX + 20, 130);
    doc
      .fontSize(16)
      .fillColor("#18181b")
      .text(`${capitalizeFirst(data.firstName)} ${capitalizeFirst(data.surname)}`, cardX + 20, 148);
    doc.fontSize(10).fillColor("#18181b").text(data.mobileNumber || "—", cardX + 20, 172);
    doc.fontSize(10).fillColor("#18181b").text(data.email, cardX + 20, 186);

    doc.image(qrBuffer, cardX + cardWidth - 170, 100, { width: 120, height: 120 });
    doc.rect(cardX + cardWidth - 172, 98, 124, 124).stroke();
    doc.fontSize(9).font("Courier").fillColor("#18181b").text(data.uniqueCode, cardX + cardWidth - 170, 224, { width: 120, align: "center" });

    doc.font("Helvetica").fontSize(12).fillColor("#18181b").text(data.eventName, cardX + 20, 260, { width: cardWidth - 40 });
    doc.fontSize(10).fillColor("#18181b");
    doc.text(`Start Date    ${formatEventDateTime(data.eventStartDate)}`, cardX + 20, 290);
    doc.text(`End Date      ${formatEventDateTime(data.eventEndDate)}`, cardX + 20, 306);
    doc.text(`Venue         ${data.venue || "—"}`, cardX + 20, 322);
    doc.fontSize(8).fillColor("#52525b").text(`Registered Date – ${formatRegisteredDate(data.createdAt)}`, cardX + 20, 378);
    doc.end();
  });
}
