import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  // 입력 요소에 오류·도움말을 연결 (스크린리더가 어떤 칸이 틀렸는지 읽도록)
  const describedBy = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children;
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
      {control}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
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
