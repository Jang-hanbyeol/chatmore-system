"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";

/** 페이지 렌더 중 오류(DB 연결 실패 등) — 기본 오류 화면 대신 안내와 재시도 제공 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <Logo variant="vertical" height={96} />
      <h1 className="mt-7 text-2xl font-semibold text-ink">일시적인 문제가 발생했습니다</h1>
      <p className="mt-3 max-w-md text-body">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 오류 신고로 알려 주세요.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted">오류 코드: {error.digest}</p>
      )}
      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-active"
        >
          다시 시도
        </button>
        <Link href="/home" className="rounded-md bg-strong px-5 py-2.5 font-semibold text-ink hover:bg-hairline">
          홈으로
        </Link>
      </div>
    </div>
  );
}
