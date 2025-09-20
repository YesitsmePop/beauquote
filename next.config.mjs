/** @type {import('next').NextConfig} */
const nextConfig = {
  // write build output to a different folder to avoid permission issues on some systems
  distDir: '.next_build',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three']
  }
}

export default nextConfig
