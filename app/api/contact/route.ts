import { NextResponse } from "next/server";
import { isContactEmailConfigured, sendContactEmails } from "@/lib/contact-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || name.length > 100) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15 || phone.length > 24) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
    }

    if (!isContactEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Please try again later." },
        { status: 503 }
      );
    }

    const result = await sendContactEmails({ name, email, phone, message });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Unable to send your message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the server. Please try again." },
      { status: 500 }
    );
  }
}
