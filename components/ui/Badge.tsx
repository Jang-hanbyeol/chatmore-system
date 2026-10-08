import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDot,
  Clock,
  FileEdit,
  ShieldCheck,
  XCircle,
} from "lucide-react";

/** 라벨 배지 — 색상만으로 상태를 전달하지 않도록 아이콘+텍스트 병행 */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-strong text-ink",
        tone === "blue" && "bg-primary/10 text-primary",
        tone === "green" && "bg-up/10 text-up",
        tone === "amber" && "bg-warn/10 text-warn",
        tone === "red" && "bg-down/10 text-down",
        tone === "dark" && "bg-white/10 text-white",
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<
  string,
  { label: string; tone: "neutral" | "blue" | "green" | "amber" | "red"; icon: typeof CircleDot }
> = {
  // 데이터 상태
  draft: { label: "임시저장", tone: "neutral", icon: FileEdit },
  active: { label: "사용중", tone: "green", icon: CheckCircle2 },
  needs_review: { label: "검토 필요", tone: "amber", icon: AlertTriangle },
  outdated: { label: "만료", tone: "red", icon: Clock },
  archived: { label: "보관", tone: "neutral", icon: Archive },
  sync_failed: { label: "동기화 실패", tone: "red", icon: XCircle },
  // 공지 상태
  published: { label: "공개", tone: "green", icon: CheckCircle2 },
  // 피드백/신고 상태
  new: { label: "신규", tone: "blue", icon: CircleDot },
  reviewing: { label: "검토중", tone: "amber", icon: Clock },
  resolved: { label: "해결됨", tone: "green", icon: CheckCircle2 },
  data_updated: { label: "데이터 수정됨", tone: "green", icon: CheckCircle2 },
  model_review_required: { label: "모델 검토 필요", tone: "amber", icon: AlertTriangle },
  closed: { label: "종료", tone: "neutral", icon: Archive },
  // 계정 상태
  inactive: { label: "휴면", tone: "neutral", icon: Clock },
  suspended: { label: "정지", tone: "red", icon: XCircle },
  deleted: { label: "탈퇴", tone: "neutral", icon: Archive },
  // 출처 상태
  official: { label: "공식 자료", tone: "blue", icon: ShieldCheck },
  review_required: { label: "확인 필요", tone: "amber", icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    tone: "neutral" as const,
    icon: CircleDot,
  };
  const Icon = s.icon;
  return (
    <Badge tone={s.tone}>
      <Icon size={12} aria-hidden />
      {s.label}
    </Badge>
  );
}
