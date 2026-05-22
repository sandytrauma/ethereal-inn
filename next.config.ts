import type { NextConfig } from "next";

const nextConfig: NextConfig = {

 images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // Allows all image paths coming from Unsplash safely
      },
    ],
  },
};

export default nextConfig;
