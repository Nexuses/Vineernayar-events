import "server-only";

import { getDb } from "@/lib/mongodb";

type OtpStatus = "pending" | "verified" | "expired";

type OtpDocument = {
  phone: string;
  otp?: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  createdAt: Date;
  status: OtpStatus;
  verifiedAt?: Date;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

let indexEnsured = false;

export function normalizePhoneForOtp(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("+")) {
    return "";
  }
  const normalized = `+${trimmed.slice(1).replace(/[^\d]/g, "")}`;
  return /^\+\d{8,15}$/.test(normalized) ? normalized : "";
}

async function ensureOtpIndexes() {
  if (indexEnsured) {
    return;
  }

  const db = await getDb();
  const collection = db.collection<OtpDocument>("otps");

  const existingCollections = await db.listCollections({ name: "otps" }).toArray();
  if (existingCollections.length > 0) {
    const indexes = await collection.indexes();

    for (const index of indexes) {
      if (index.name === "_id_") {
        continue;
      }

      const isPhoneIndex = index.key?.phone === 1;
      const isExpiresAtIndex = index.key?.expiresAt === 1;

      if (isPhoneIndex && index.name !== "otps_phone_unique") {
        await collection.dropIndex(index.name!);
      }

      if (isExpiresAtIndex && index.name !== "otps_expires_at_pending_ttl") {
        await collection.dropIndex(index.name!);
      }
    }
  }

  await collection.createIndex({ phone: 1 }, { unique: true, name: "otps_phone_unique" });

  await collection.createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      partialFilterExpression: { status: "pending" },
      name: "otps_expires_at_pending_ttl",
    }
  );

  indexEnsured = true;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveOtp(phone: string, otp: string): Promise<void> {
  await ensureOtpIndexes();

  const normalized = normalizePhoneForOtp(phone);
  const now = new Date();

  const db = await getDb();
  await db.collection<OtpDocument>("otps").updateOne(
    { phone: normalized },
    {
      $set: {
        phone: normalized,
        otp,
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: now,
        status: "pending",
      },
      $setOnInsert: {
        createdAt: now,
      },
      $unset: {
        verifiedAt: "",
      },
    },
    { upsert: true }
  );
}

export async function canResendOtp(
  phone: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  await ensureOtpIndexes();

  const normalized = normalizePhoneForOtp(phone);
  const db = await getDb();
  const entry = await db.collection<OtpDocument>("otps").findOne({ phone: normalized });

  if (!entry) {
    return { allowed: true };
  }

  const elapsed = Date.now() - entry.lastSentAt.getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }

  return { allowed: true };
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<
  { success: true } | { success: false; reason: "not_found" | "expired" | "too_many_attempts" | "invalid" }
> {
  await ensureOtpIndexes();

  const normalized = normalizePhoneForOtp(phone);
  const db = await getDb();
  const collection = db.collection<OtpDocument>("otps");
  const entry = await collection.findOne({ phone: normalized });

  if (!entry || entry.status === "verified") {
    return { success: false, reason: "not_found" };
  }

  if (Date.now() > entry.expiresAt.getTime()) {
    await collection.updateOne(
      { phone: normalized },
      { $set: { status: "expired" }, $unset: { otp: "" } }
    );
    return { success: false, reason: "expired" };
  }

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    await collection.updateOne(
      { phone: normalized },
      { $set: { status: "expired" }, $unset: { otp: "" } }
    );
    return { success: false, reason: "too_many_attempts" };
  }

  if (entry.otp !== otp.trim()) {
    await collection.updateOne({ phone: normalized }, { $inc: { attempts: 1 } });
    return { success: false, reason: "invalid" };
  }

  await collection.updateOne(
    { phone: normalized },
    {
      $set: { status: "verified", verifiedAt: new Date() },
      $unset: { otp: "" },
    }
  );

  return { success: true };
}

export function getOtpTtlMinutes(): number {
  return OTP_TTL_MS / 60000;
}
