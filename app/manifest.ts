import type { MetadataRoute } from "next";

/**
 * 설치형 앱(PWA) 매니페스트.
 * window-controls-overlay: 앱으로 설치하면 Windows 제목 표시줄 영역을 앱 상단바(AppTitleBar)가
 * 함께 쓰고, 최소화·최대화·닫기 버튼은 OS 기본 버튼이 상단바 오른쪽에 겹쳐 표시된다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chatmore — AI 기반 대학 생활정보 챗봇",
    short_name: "Chatmore",
    description: "학사, 장학금, 비교과 프로그램과 대학 생활정보를 자연어로 묻는 순천대학교 챗봇",
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#f7f8fa",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
