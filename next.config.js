/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    serverComponentsExternalPackages: ['@prisma/client', 'canvas', 'sharp', 'tesseract.js'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude native modules from webpack bundling
      config.externals.push({
        'canvas': 'commonjs canvas',
        'sharp': 'commonjs sharp',
        'tesseract.js': 'commonjs tesseract.js',
      })
    }
    return config
  },
}

module.exports = nextConfig




