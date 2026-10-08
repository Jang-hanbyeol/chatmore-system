"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** confirm 창을 거쳐 부모 form 을 제출하는 버튼 (처리 중에는 비활성화) */
export function ConfirmSubmit({
  children,
  confirmMessage,
  className,
  pendingLabel,
  ariaLabel,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  pendingLabel?: ReactNode;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      aria-label={ariaLabel}
      disabled={pending}
      aria-disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
