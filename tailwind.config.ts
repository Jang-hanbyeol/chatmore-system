import type { Config } from "tailwindcss";

/**
 * Chatmore System 디자인 토큰
 * 근거: DESIGNcoinbase.md 재해석 + 시스템 UI 스펙(§31~33).
 * - 단일 액센트 컬러(#0052ff), 화이트 캔버스, 명확한 정보 위계
 * - 앱/대시보드 UI이므로 카드 8~16px, 버튼 8~12px 라운드 (마케팅 pill 지양)
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          active: "var(--color-primary-active)",
          disabled: "var(--color-primary-disabled)",
        },
        ink: "var(--color-ink)",
        body: "var(--color-text-secondary)",
        muted: "var(--color-muted)",
        "muted-soft": "var(--color-muted-soft)",
        hairline: "var(--color-border)",
        "hairline-soft": "var(--color-border-soft)",
        canvas: "var(--color-background)",
        surface: "var(--color-surface)",
        soft: "var(--color-surface-soft)",
        strong: "var(--color-surface-strong)",
        dark: "var(--color-surface-dark)",
        darkel: "var(--color-surface-dark-elevated)",
        "on-dark-soft": "var(--color-on-dark-soft)",
        up: "var(--color-success)",
        down: "var(--color-error)",
        warn: "var(--color-warning)",
        info: "var(--color-info)",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "100px",
      },
      boxShadow: {
        card: "var(--shadow-sm)",
        lift: "var(--shadow-md)",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        typing: "typing 1.2s ease-in-out infinite",
        slideUp: "slideUp 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
