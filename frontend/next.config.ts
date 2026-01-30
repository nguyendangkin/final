import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        // Production API server - update this when deploying
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME || 'api.icheck.app',
        pathname: '/uploads/**',
      },
    ],
    // Bypass Next.js Image Optimization for localhost (private IP issue)
    // In production with real domain, optimization will work normally
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;

