/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    // Handle Syncfusion modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Optimize Syncfusion bundle
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          syncfusion: {
            test: /[\\/]node_modules[\\/]@syncfusion[\\/]/,
            name: 'syncfusion',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    }

    return config
  },
  // Transpile Syncfusion modules
  transpilePackages: [
    '@syncfusion/ej2-react-pivotview',
    '@syncfusion/ej2-pivotview',
    '@syncfusion/ej2-base',
    '@syncfusion/ej2-data',
    '@syncfusion/ej2-excel-export',
    '@syncfusion/ej2-pdf-export',
    '@syncfusion/ej2-compression',
    '@syncfusion/ej2-file-utils'
  ]
}

module.exports = nextConfig
