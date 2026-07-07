/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  experimental: {
    esmExternals: 'loose'
  },
  // Increase static page generation timeout
  staticPageGenerationTimeout: 120,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer, dev }) => {
    // Handle Syncfusion modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Optimize Syncfusion bundle with better chunk splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
          // Syncfusion libraries
          syncfusion: {
            test: /[\\/]node_modules[\\/]@syncfusion[\\/]/,
            name: 'syncfusion',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          // AG Grid libraries
          aggrid: {
            test: /[\\/]node_modules[\\/]ag-grid/,
            name: 'ag-grid',
            chunks: 'all',
            priority: 9,
            reuseExistingChunk: true,
          },
          // Common vendor chunks
          commons: {
            name: 'commons',
            test: /[\\/]node_modules[\\/]/,
            priority: 8,
            minChunks: 2,
            reuseExistingChunk: true,
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
