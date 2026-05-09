/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/food-ordering',
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com'],
  },
};

module.exports = nextConfig;
