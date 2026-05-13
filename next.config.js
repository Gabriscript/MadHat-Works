const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    // @react-pdf/renderer ships native font + canvas helpers - it must run outside
    // the bundler so Node can load it server-side.
    serverComponentsExternalPackages: ['@react-pdf/renderer', '@prisma/client', 'prisma'],
    serverActions: {
      // Next.js 14 blocks Server Actions when `origin` host differs from `x-forwarded-host`
      // (a CSRF-style guard). Behind this Kubernetes ingress the browser-visible host and
      // the cluster-internal host differ - whitelist both shapes.
      allowedOrigins: [
        'localhost:3000',
        '*.preview.emergentagent.com',
        '*.emergentagent.com',
        '*.preview.emergentcf.cloud',
        '*.cluster-1.preview.emergentcf.cloud',
        '*.cluster-2.preview.emergentcf.cloud',
        '*.cluster-3.preview.emergentcf.cloud',
        '*.cluster-4.preview.emergentcf.cloud',
        '*.cluster-5.preview.emergentcf.cloud',
        '*.cluster-6.preview.emergentcf.cloud',
        '*.cluster-7.preview.emergentcf.cloud',
        '*.cluster-8.preview.emergentcf.cloud',
        '*.cluster-9.preview.emergentcf.cloud',
        '*.cluster-10.preview.emergentcf.cloud',
        '*.emergentcf.cloud',
        '*.emergent.host',
      ],
      bodySizeLimit: '2mb',
    },
  },
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
