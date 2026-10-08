"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * 서버 액션 폼 제출 버튼: 처리 중 비활성화(중복 제출 방지)·문구 변경,
 * 끝나면 잠시 "저장됨"을 보여 결과를 알린다 (스크린리더에도 알림).
 */
export function PendingButton({
  children,
  className,
  pendingLabel = "저장 중…",
  doneLabel = "저장됨",
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  doneLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [done, setDone] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setDone(true);
      const t = setTimeout(() => setDone(false), 2000);
      wasPending.current = false;
      return () => clearTimeout(t);
    }
    if (pending) wasPending.current = true;
  }, [pending]);

  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      <span aria-live="polite">{pending ? pendingLabel : done ? doneLabel : children}</span>
    </button>
  );
}
