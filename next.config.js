/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🔥 REQUIRED FOR CAMERA + MICROPHONE ON VERCEL
  experimental: {
    serverActions: true,
  },

  // 🔥 ALLOW BROWSER TO USE CAMERA/MIC OVER HTTPS
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // 🔥 MOST IMPORTANT PART — ALLOWS CHROME/ANDROID TO USE getUserMedia
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "camera=*, microphone=*, geolocation=(self), fullscreen=*",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
