import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@roohae/shared', '@roohae/editor-sdk', '@roohae/ui'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'api.roohae.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
    ],
  },
};

export default nextConfig;
