import { Resvg } from "@resvg/resvg-js";
import { getPassFontFiles } from "./pass-fonts";

/** Rasterize pass SVG with embedded project fonts (works on Vercel/Linux; Sharp/librsvg does not). */
export function renderPassSvgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: getPassFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    },
  });
  return Buffer.from(resvg.render().asPng());
}
