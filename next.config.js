/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Old-design pages were removed; keep their URLs working (permanent redirects to the home page).
  async redirects() {
    return [
      { source: "/mission", destination: "/", permanent: true },
      { source: "/solutions", destination: "/", permanent: true },
      // The old name of Cipher Studio: keep any old links working (permanent).
      { source: "/forge", destination: "/cipher-studio", permanent: true },
      { source: "/forge/:path*", destination: "/cipher-studio", permanent: true },
      { source: "/cipher-forge", destination: "/cipher-studio", permanent: true },
      { source: "/cipher-forge/:path*", destination: "/cipher-studio", permanent: true },
      { source: "/cipherforge", destination: "/cipher-studio", permanent: true },
    ];
  },

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
