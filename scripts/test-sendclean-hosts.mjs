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
const hosts = [
  env.SENDCLEAN_API_HOST || "us1-mta1.sendclean.net",
  "sendclean.net",
  "smtp.sendclean.net",
];

for (const host of hosts) {
  const url = `https://api.${host}/v1.0/messages/sendMail`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_id: env.SENDCLEAN_OWNER_ID,
        token: env.SENDCLEAN_TOKEN,
        smtp_user_name: env.SENDCLEAN_SMTPUSER,
        message: {
          html: "<p>test</p>",
          subject: "test",
          from_email: env.SMTP_FROM_EMAIL,
          to: [{ email: "test@example.com", type: "to" }],
        },
      }),
    });
    const data = await response.json();
    console.log(host, response.status, data.status, data.message || data.type);
  } catch (error) {
    console.log(host, "fetch error", error instanceof Error ? error.message : error);
  }
}
