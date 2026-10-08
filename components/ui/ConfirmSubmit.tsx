"use client";

import type { ReactNode } from "react";

/** confirm 창을 거쳐 부모 form 을 제출하는 버튼 */
export function ConfirmSubmit({
  children,
  confirmMessage,
  className,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
