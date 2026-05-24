/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /* ============================================================
             🔒 LOCAL SUBSTRATE COOP ISOLATION HEADERS
             Required to allow WebGPU memory buffers to run on device
          ============================================================ */
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self)"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          }
        ]
      }
    ];
  },

  // ADDED WEBPACK CONFIGURATION TO ALLOW 'IMPORT.META' CHUNKS
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    };
    
    return config;
  },
};

module.exports = nextConfig;
