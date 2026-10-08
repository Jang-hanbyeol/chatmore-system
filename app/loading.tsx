import { SymbolBadge } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-4"
      role="status"
      aria-label="불러오는 중"
    >
      <SymbolBadge size={52} className="animate-pulse" />
      <p className="text-sm text-muted">불러오는 중...</p>
    </div>
  );
}
