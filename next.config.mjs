const isDev = process.env.NODE_ENV === "development"

const nextConfig = {
  allowedDevOrigins: ["http://10.11.112.221:3000", "http://localhost:3000"],
  serverExternalPackages: ["@supabase/ssr", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oxkuxwkehinhyxfsauqe.supabase.co",
        port: "",
        pathname: "/storage/v1/**",
      },
    ],
  },
  ...(isDev ? { devIndicators: { position: "bottom-right" } } : {}),
}

export default nextConfig
