/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable proper server-side functionality for Supabase
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
