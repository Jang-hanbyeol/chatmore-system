/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
    // Vercel: 빌드 시 시드된 SQLite 파일을 서버리스 함수 번들에 포함
    outputFileTracingIncludes: {
      "/**/*": ["./prisma/dev.db"],
    },
  },
};

export default nextConfig;
