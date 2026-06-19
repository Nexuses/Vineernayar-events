import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./lib/fonts/**/*"],
  },
};

export default nextConfig;
