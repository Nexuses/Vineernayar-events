import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });
  try {
    const dataUrl = await QRCode.toDataURL(code, { width: 256, margin: 2 });
    const base64 = dataUrl.split(",")[1];
    if (!base64) return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
