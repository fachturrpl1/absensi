import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

// Content Security Policy untuk production dengan PWA support
const cspHeader = isDev ? '' : `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in;
  media-src 'self';
  worker-src 'self' blob:;
  manifest-src 'self';
  upgrade-insecure-requests;
`;

const securityHeaders = isDev ? [] : [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  ...(cspHeader ? [{
    key: 'Content-Security-Policy',
    value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
  }] : []),
];

const nextConfig: NextConfig = {
  // Security: Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable strict mode for better error handling
  reactStrictMode: true,
  
  // Disable ESLint during build (warnings treated as errors in production)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build if needed
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checking enabled
  },
  
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
      bodySizeLimit: "20mb",
    },
  },
  
  // Configure headers untuk security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Service Worker - no cache
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      // Special headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Headers for static assets
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Configure rewrites for PWA files
  async rewrites() {
    return {
      beforeFiles: [
        // Explicitly serve service worker from public folder
        {
          source: '/sw.js',
          destination: '/sw.js',
          has: [
            {
              type: 'header',
              key: 'accept',
              value: '(.*text/javascript.*|.*application/javascript.*|.*\\*/\\*.*)',
            },
          ],
        },
      ],
    };
  },

  // Configure redirects for old pages
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Output configuration for production
  output: 'standalone',
  
  // Configure dev indicators for development
  ...(isDev && {
    devIndicators: {
      position: 'bottom-right',
    },
  }),
};

export default nextConfig;
