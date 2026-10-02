import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 증적파일은 Route Handler로 업로드하므로 Server Action 본문은 입력값만 담습니다.
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
