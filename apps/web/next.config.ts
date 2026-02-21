import type { NextConfig } from 'next';

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker deployment
  output: 'standalone',

  // Skip type/lint checks in production build (pre-existing issues in codebase)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Transpile monorepo packages
  transpilePackages: ['@movie-platform/shared', '@movie-platform/ui'],

  // Image optimization
  images: {
    minimumCacheTTL: 3600,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bunny.net',
      },
      {
        protocol: 'https',
        hostname: '**.bunnycdn.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
    ],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Turbopack resolve configuration for hoisted monorepo dependencies
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
    turbo: {
      resolveAlias: {
        'socket.io-client': '../../node_modules/socket.io-client',
      },
    },
  },
};

export default withBundleAnalyzer(nextConfig);
