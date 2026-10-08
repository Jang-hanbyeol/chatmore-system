"use client";

/**
 * 루트 레이아웃 자체가 실패했을 때(예: 접근성 설정 조회 중 DB 오류)의 최후 화면.
 * 레이아웃·전역 CSS 없이 렌더되므로 최소한의 인라인 스타일만 쓴다.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f8fa",
          color: "#0a0b0d",
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>일시적인 문제가 발생했습니다</h1>
        <p style={{ margin: 0, color: "#5b616e" }}>잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 20px",
            border: 0,
            borderRadius: 12,
            background: "#0052ff",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
