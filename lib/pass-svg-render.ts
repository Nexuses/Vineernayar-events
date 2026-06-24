import { Resvg } from "@resvg/resvg-js";
import { getPassFontDir, getPassFontFiles } from "./pass-fonts";

/** Rasterize pass SVG with embedded project fonts (works on Vercel/Linux; Sharp/librsvg does not). */
export function renderPassSvgToPng(svg: string): Buffer {
  const fontDir = getPassFontDir();
  const resvg = new Resvg(svg, {
    font: {
      fontDirs: [fontDir],
      fontFiles: getPassFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: "Roboto",
      sansSerifFamily: "Roboto",
    },
  });
  return Buffer.from(resvg.render().asPng());
}
