import { NextResponse } from "next/server";
import { processDueEmailSequences } from "@/lib/email-sequence-runner";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processDueEmailSequences();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Email sequence cron failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
