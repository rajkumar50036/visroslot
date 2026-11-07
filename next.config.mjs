/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "firebase",
      "@firebase/firestore",
      "@firebase/auth",
      "@firebase/app",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
