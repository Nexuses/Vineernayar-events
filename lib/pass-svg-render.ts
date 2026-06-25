import { Resvg } from "@resvg/resvg-js";

/** Rasterize pass SVG with Helvetica (system fonts; reliable on Vercel/Linux). */
export function renderPassSvgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Helvetica",
      sansSerifFamily: "Helvetica",
    },
  });
  return Buffer.from(resvg.render().asPng());
}
