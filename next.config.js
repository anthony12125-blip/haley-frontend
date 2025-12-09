/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Enable static exports if needed
  // output: 'export',
}

module.exports = nextConfig
