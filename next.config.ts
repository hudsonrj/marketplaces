import type { NextConfig } from "next";

// Force restart
const nextConfig: NextConfig = {
  serverExternalPackages: ["duckdb"],
};

export default nextConfig;
