/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@comtech/types'],
  eslint: { ignoreDuringBuilds: true },
  // Cho phép truy cập qua preview host (dev)
  experimental: {
    // allowedDevOrigins áp dụng ở Next 14.2+ để tránh chặn host preview
  },
};

export default nextConfig;
