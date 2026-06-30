import { readFileSync } from "node:fs";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv(".env.local");
const owner_id = env.SENDCLEAN_OWNER_ID;
const token = env.SENDCLEAN_TOKEN;
const smtp_user_name = env.SENDCLEAN_SMTPUSER;
const host = env.SENDCLEAN_API_HOST || "us1-mta1.sendclean.net";
const url = `https://api.${host}/v1.0/messages/sendMail`;

if (!owner_id || !token || !smtp_user_name) {
  console.error("Missing SENDCLEAN_OWNER_ID, SENDCLEAN_TOKEN, or SENDCLEAN_SMTPUSER");
  process.exit(1);
}

const body = {
  owner_id,
  token,
  smtp_user_name,
  message: {
    html: "<p>SendClean API connectivity test</p>",
    subject: "HFMS API test",
    from_email: env.SMTP_FROM_EMAIL,
    from_name: env.SMTP_FROM_NAME,
    to: [{ email: env.TEST_EMAIL_TO || "arpit.m@nexuses.in", name: "Test", type: "to" }],
    headers: { "Reply-To": env.SMTP_REPLY_EMAIL || env.SMTP_FROM_EMAIL },
  },
};

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const data = await response.json();
console.log(JSON.stringify({ httpStatus: response.status, ...data }, null, 2));
process.exit(data.status === "success" ? 0 : 1);
