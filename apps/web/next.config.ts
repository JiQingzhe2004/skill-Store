import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 只在生产环境使用 standalone
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  transpilePackages: ['@skill-store/shared'],
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'localhost:3002',
        'localhost:3100',
        'localhost:3101',
        'localhost:4520',
        'localhost:4521',
      ],
    },
    // 优化编译速度
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // 开发环境优化
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false, // 减少重复渲染
  }),
  // 减少编译时间
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
