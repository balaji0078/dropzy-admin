/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "18.60.129.43",
        port: "8080",
      },
    ],
  },
};

module.exports = nextConfig;
