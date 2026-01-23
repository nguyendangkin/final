import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
      },
      {
        protocol: 'https',
        hostname: '**', // TODO: Security - Restrict this to specific domains in production
      }
    ],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
