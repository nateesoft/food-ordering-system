/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/food-ordering',
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost',
        port: process.env.NEXT_PUBLIC_MINIO_PORT || '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
