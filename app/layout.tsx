import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "개인정보 처리시스템 점검 자료 취합",
  description: "개인정보 처리시스템 안전성 확보조치 점검 자료 제출 및 검토",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
