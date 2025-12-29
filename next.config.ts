import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for Railway deployment
  output: 'standalone', // Creates optimized standalone build
};

export default nextConfig;
