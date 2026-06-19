import { after, NextResponse } from "next/server";
import { isJoinEmailConfigured, sendJoinEmails } from "@/lib/join-email";
import { JOIN_CITIES } from "@/lib/join-cities";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const city = String(body?.city ?? "").trim();

    if (!name || !email || !city) {
      return NextResponse.json(
        { error: "Name, email, and city are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!JOIN_CITIES.includes(city as (typeof JOIN_CITIES)[number])) {
      return NextResponse.json({ error: "Please choose a valid city." }, { status: 400 });
    }

    if (!isJoinEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Please try again later." },
        { status: 503 }
      );
    }

    after(async () => {
      const result = await sendJoinEmails({ name, email, city });
      if (!result.ok) {
        console.error("Background join email failed:", result.error);
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the server. Please try again." },
      { status: 500 }
    );
  }
}
