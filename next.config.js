/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standard security headers without COOP/COEP isolation,
  // ensuring Stripe checkout, external scripts, and embeds load smoothly.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
