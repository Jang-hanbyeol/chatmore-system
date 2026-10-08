import { db } from "@/lib/database/db";
import type { RelatedNotice, SourceItem } from "@/types/chat";
import type { RankedSource } from "./rag-service";

/** InformationSource → SourceItem 변환 및 관련 공지 조회 */

function dateStr(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

export function toSourceItem(s: RankedSource): SourceItem {
  const expired = s.endAt ? s.endAt.getTime() < Date.now() : false;
  return {
    id: s.id,
    title: s.title,
    category: s.category,
    department: s.department,
    publishedAt: dateStr(s.publishedAt),
    updatedAt: dateStr(s.updatedAt),
    sourceUrl: s.sourceUrl ?? undefined,
    attachmentUrl: s.attachmentUrl ?? undefined,
    excerpt: s.summary,
    status: expired
      ? "outdated"
      : s.dataStatus === "needs_review"
        ? "review_required"
        : "official",
  };
}

export async function findRelatedNotices(
  categories: string[],
  limit = 3
): Promise<RelatedNotice[]> {
  if (categories.length === 0) return [];
  const notices = await db.notice.findMany({
    where: { status: "published", category: { in: categories } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    department: n.department,
    publishedAt: dateStr(n.createdAt),
    endAt: dateStr(n.endAt) ?? null,
  }));
}
