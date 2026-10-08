import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Chatmore 브랜드 로고 컴포넌트.
 * /public/brand/ 의 실제 SVG 로고 파일을 사용합니다.
 */
type Variant =
  | "horizontal" // 심볼 + 워드마크 (기본)
  | "vertical"
  | "symbol"
  | "wordmark"
  | "white" // 다크 배경용 반전 가로형
  | "black"
  | "korean"; // 한글 설명 포함형

const FILES: Record<Variant, { src: string; w: number; h: number }> = {
  horizontal: { src: "/brand/chatmore-logo-horizontal.svg", w: 262, h: 52 },
  vertical: { src: "/brand/chatmore-logo-vertical.svg", w: 172, h: 114 },
  symbol: { src: "/brand/chatmore-logo-symbol.svg", w: 64, h: 64 },
  wordmark: { src: "/brand/chatmore-wordmark.svg", w: 200, h: 39 },
  white: { src: "/brand/chatmore-logo-white.svg", w: 262, h: 52 },
  black: { src: "/brand/chatmore-logo-black.svg", w: 262, h: 52 },
  korean: { src: "/brand/chatmore-logo-korean.svg", w: 242, h: 66 },
};

export function Logo({
  variant = "horizontal",
  height = 32,
  className,
  priority,
}: {
  variant?: Variant;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const f = FILES[variant];
  const width = Math.round((f.w / f.h) * height);
  return (
    <Image
      src={f.src}
      alt="Chatmore 로고"
      width={width}
      height={height}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}

/** 챗봇 프로필 등에서 쓰는 심볼 원형 배지 */
export function SymbolBadge({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/brand/chatmore-symbol-white.svg"
        alt=""
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
      />
    </span>
  );
}
