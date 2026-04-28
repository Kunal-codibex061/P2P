import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow temporary tunnel domains when sharing local dev server.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
