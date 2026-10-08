import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** 시스템 UI 버튼 — 앱/대시보드용 라운드(8~12px), 명확한 위계 */
const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-active disabled:bg-primary-disabled",
  secondary: "bg-strong text-ink hover:bg-hairline",
  outline: "border border-hairline bg-surface text-ink hover:bg-soft",
  ghost: "text-body hover:bg-soft hover:text-ink",
  danger: "bg-down text-white hover:opacity-90",
  text: "text-primary hover:text-primary-active",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
