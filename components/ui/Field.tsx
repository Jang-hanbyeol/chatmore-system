import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 폼 필드 래퍼: label + control + error 를 접근성 있게 연결 */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-down" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-down">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputCls = (error?: string) =>
  cn(
    "w-full rounded-md border bg-canvas px-4 py-3 text-base text-ink placeholder:text-muted-soft",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
    error ? "border-down" : "border-hairline"
  );
