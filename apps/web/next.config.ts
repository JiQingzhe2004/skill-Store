import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@skill-store/shared'],
  devIndicators: false,
}

export default nextConfig
