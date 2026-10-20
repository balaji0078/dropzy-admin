/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "16.112.168.63",
        port: "8080",
      },
    ],
  },
};

module.exports = nextConfig;
