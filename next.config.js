/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Force Next.js to process the package rules for modern browser modules cleanly
  transpilePackages: ['onnxruntime-web', '@huggingface/transformers'],

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

  webpack: (config, { isServer }) => {
    // 🧪 Force Webpack to support modern modules and assembly code rules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
    };

    // Fix the syntax error by telling Webpack how to handle raw module files safely
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;
