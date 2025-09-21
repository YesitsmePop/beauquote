/** @type {import('next').NextConfig} */
const nextConfig = {
  // use Next's default output directory so Vercel can find routes-manifest.json
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
