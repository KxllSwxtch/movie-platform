import type { NextConfig } from 'next';
import path from 'path';

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (config: NextConfig) => config;

// Build dynamic remote patterns from environment URLs (APP_URL, API_URL)
const envRemotePatterns: { protocol: 'http' | 'https'; hostname: string }[] = [];
for (const envUrl of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_MINIO_URL]) {
  if (envUrl) {
    try {
      const { protocol, hostname } = new URL(envUrl);
      envRemotePatterns.push({
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
      });
    } catch {}
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker deployment
  output: 'standalone',

  // Transpile monorepo packages
  transpilePackages: ['@movie-platform/shared'],

  // Use Phosphor's SSR entrypoint in server bundles. The CSR entrypoint uses
  // client-only context, while the local noop stub rendered different SVG
  // markup and caused React hydration errors.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['@phosphor-icons/react'] = path.join(
        path.dirname(require.resolve('@phosphor-icons/react/package.json')),
        'dist/ssr/index.es.js',
      );
    }
    return config;
  },

  // Image optimization
  images: {
    minimumCacheTTL: 3600,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...envRemotePatterns,
      {
        protocol: 'https',
        hostname: '**.bunny.net',
      },
      {
        protocol: 'https',
        hostname: '**.bunnycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },

  // Redirect /admin to /admin/dashboard
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/partners',
        destination: '/partner',
        permanent: true,
      },
    ];
  },

  // Proxy MinIO buckets through the web app.
  // - In production, nginx already proxies /minio/* to MinIO.
  // - In local Docker dev (without nginx), Next.js must proxy /minio/* to reach the MinIO container.
  async rewrites() {
    const targetBase =
      process.env.MINIO_INTERNAL_ENDPOINT ||
      process.env.NEXT_PUBLIC_MINIO_URL ||
      'http://localhost:9000';

    const normalizedTarget = targetBase.replace(/\/+$/, '');

    return [
      {
        source: '/minio/:path*',
        destination: `${normalizedTarget}/:path*`,
      },
    ];
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_TEST_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENTS,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  },

  // Turbopack resolve configuration for hoisted monorepo dependencies
  experimental: {
    turbo: {
      resolveAlias: {
        'socket.io-client': '../../node_modules/socket.io-client',
      },
    },
  },
};

export default withBundleAnalyzer(nextConfig);
