import type { FullPassData } from "./pass-card-image";
import { generateVectorPassPdf } from "./pass-pdf-vector";

export type { FullPassData };

/** Download pass PDF on A4 — vector text via pdf-lib (reliable on Vercel). */
export async function generateFullPassPdf(data: FullPassData): Promise<Buffer> {
  return generateVectorPassPdf(data);
}
