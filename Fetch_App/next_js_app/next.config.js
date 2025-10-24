const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Ensure these packages are treated as external in server contexts
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Avoid bundling browser-oriented builds that expect DOM APIs like DOMMatrix
      config.externals = [...(config.externals || []), "pdf-parse", "pdfjs-dist"];
    }
    return config;
  },
};

module.exports = nextConfig;
