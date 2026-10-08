import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Chatmore | AI 기반 대학 생활정보 챗봇",
    template: "%s | Chatmore",
  },
  description:
    "학사, 장학금, 비교과 프로그램과 대학 생활정보를 자연어 질문으로 확인하는 AI 기반 순천대학교 맞춤형 생활정보 챗봇 시스템입니다.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false }, // 로그인 기반 시스템 UI — 검색 노출 제외
};

export const viewport: Viewport = {
  themeColor: "#0052ff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a href="#main" className="skip-nav">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
