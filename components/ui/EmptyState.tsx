import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-hairline bg-surface px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-strong">
          <Icon size={22} className="text-muted" aria-hidden />
        </span>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-body">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
