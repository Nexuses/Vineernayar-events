import type { NextConfig } from "next";

const RESVG_TRACE = [
  "./node_modules/@resvg/resvg-js/**/*",
  "./node_modules/@resvg/resvg-js-linux-x64-gnu/**/*",
  "./node_modules/@resvg/resvg-js-linux-x64-musl/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  outputFileTracingIncludes: {
    "/api/pass/[code]": RESVG_TRACE,
    "/api/events/[eventId]/register": RESVG_TRACE,
    "/api/cron/email-sequence": RESVG_TRACE,
  },
};

export default nextConfig;
