import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for Docker and Railway deployment
  output: 'standalone', // Creates optimized standalone build for Docker
};

export default nextConfig;
