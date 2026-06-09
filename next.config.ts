import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/documents/**/*": [
      "./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
