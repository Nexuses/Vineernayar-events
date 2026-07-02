const ENABLEX_API_BASE =
  process.env.ENABLEX_API_BASE?.trim() || "https://api.enablex.io/whatsapp/v1/messages";

export function isEnablexWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.ENABLEX_APP_ID?.trim() &&
      process.env.ENABLEX_APP_KEY?.trim() &&
      process.env.ENABLEX_WHATSAPP_FROM?.trim()
  );
}

function normalizeWhatsAppNumber(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);
    return /^\d{8,15}$/.test(digits) ? digits : null;
  }
  return /^\d{8,15}$/.test(cleaned) ? cleaned : null;
}

export async function sendEnablexWhatsAppText(args: {
  to: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEnablexWhatsAppConfigured()) {
    return { ok: false, error: "EnableX WhatsApp is not configured" };
  }

  const to = normalizeWhatsAppNumber(args.to);
  if (!to) return { ok: false, error: "Invalid WhatsApp number" };

  const appId = process.env.ENABLEX_APP_ID!.trim();
  const appKey = process.env.ENABLEX_APP_KEY!.trim();
  const from = process.env.ENABLEX_WHATSAPP_FROM!.trim();

  try {
    const auth = Buffer.from(`${appId}:${appKey}`).toString("base64");
    const res = await fetch(ENABLEX_API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [{ number: to }],
        type: "text",
        text: { body: args.message },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `EnableX error ${res.status}: ${text || "send failed"}` };
    }

    const raw = await res.text();
    if (!raw.trim()) {
      return { ok: true };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Some gateways return plain text with success token.
      if (/success|accepted|queued|submitted|sent/i.test(raw)) {
        return { ok: true };
      }
      return { ok: false, error: `EnableX unexpected response: ${raw.slice(0, 180)}` };
    }

    const body = parsed as Record<string, unknown>;
    const normalizedStatus = String(
      body.status ??
        body.message_status ??
        body.state ??
        ""
    ).toLowerCase();
    const hasId = Boolean(
      body.message_id ||
        body.request_id ||
        body.id ||
        (Array.isArray(body.messages) && body.messages.length > 0)
    );
    const hasError = Boolean(body.error || body.errors || body.message === "error");
    const statusLooksGood = /success|accepted|queued|submitted|sent/.test(normalizedStatus);

    if (!hasError && (statusLooksGood || hasId)) {
      return { ok: true };
    }

    const details = JSON.stringify(body).slice(0, 220);
    return { ok: false, error: `EnableX did not accept message: ${details}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "EnableX send failed",
    };
  }
}
