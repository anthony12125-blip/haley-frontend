/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
    NEXT_PUBLIC_NAVIGATOR_URL: process.env.NEXT_PUBLIC_NAVIGATOR_URL || 'https://navigator-service-409495160162.us-central1.run.app',
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
