import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Allow access from other devices in the same network (moved from experimental)
  allowedDevOrigins: [
    'http://10.11.112.221:3000',
    'http://localhost:3000',
  ],
  
  // External packages for server components
  serverExternalPackages: ['@supabase/ssr', 'sharp'],
  
  // Configure experimental features
  experimental: {
    // Configure Server Actions
    serverActions: {
      bodySizeLimit: '8mb', // Increased from default 1MB to 8MB for profile photo uploads
    },
  },
  
  // Configure dev indicators for development
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      position: 'bottom-right', // renamed from buildActivityPosition
    },
  }),
};

export default nextConfig;
