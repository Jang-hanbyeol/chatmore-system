import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ddayLabel } from "@/lib/utils";

export function InfoCard({
  item,
}: {
  item: {
    id: string;
    title: string;
    category: string;
    summary: string;
    department: string;
    endAt: Date | null;
    sourceUrl: string | null;
  };
}) {
  const dday = ddayLabel(item.endAt);
  return (
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-surface p-5">
      <div className="flex items-center gap-2">
        <Badge tone="blue">{item.category}</Badge>
        {dday && <Badge tone={dday === "마감됨" ? "neutral" : "amber"}>{dday}</Badge>}
      </div>
      <h3 className="mt-2.5 font-semibold text-ink">{item.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-body">{item.summary}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted">{item.department}</span>
        <div className="flex shrink-0 items-center gap-3">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-body hover:text-ink hover:underline"
            >
              원문 보기
            </a>
          )}
          <Link
            href={`/chat?q=${encodeURIComponent(`${item.title}에 대해 알려줘`)}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Chatmore에게 질문
          </Link>
        </div>
      </div>
    </div>
  );
}
