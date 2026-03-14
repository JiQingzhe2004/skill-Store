import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@skill-store/shared'],
  devIndicators: false,
}

export default nextConfig
