/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    cpus: 1,
    workerThreads: false,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
}

export default nextConfig
