import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { InfoCard } from "@/components/notice/InfoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { EXPLORE_CATEGORIES } from "@/lib/validation/schemas";
import { Compass } from "lucide-react";
import { cn, kstToday } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_GROUPS: Record<string, string[]> = {
  academic: ["학사정보"],
  scholarship: ["장학금"],
  programs: ["비교과 프로그램", "취업·창업"],
  "campus-life": ["도서관", "학생식당", "기숙사", "통학버스", "행사 및 공지"],
  facilities: ["교내 시설", "행정부서"],
};

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = EXPLORE_CATEGORIES.find((c) => c.slug === params.category);
  return { title: cat ? `${cat.name} 탐색` : "정보 탐색" };
}

export default async function ExploreCategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { sort?: string; status?: string };
}) {
  await requireOnboardedUser();
  const cat = EXPLORE_CATEGORIES.find((c) => c.slug === params.category);
  if (!cat) notFound();
  const groups = CATEGORY_GROUPS[params.category] ?? [cat.name];

  const sort = searchParams.sort ?? "latest";
  const status = searchParams.status ?? "all";
  const now = kstToday(); // 마감 당일 항목은 그날 하루 동안 유지

  const items = await db.informationSource.findMany({
    where: {
      dataStatus: "active",
      category: { in: groups },
      ...(status === "open"
        ? { OR: [{ endAt: null }, { endAt: { gte: now } }] }
        : status === "deadline"
          ? { endAt: { gte: now } }
          : {}),
    },
    orderBy:
      sort === "deadline"
        ? [{ endAt: "asc" }]
        : sort === "title"
          ? [{ title: "asc" }]
          : [{ updatedAt: "desc" }],
    take: 50,
  });

  const filterLink = (key: "sort" | "status", value: string) => {
    const p = new URLSearchParams({ sort, status });
    p.set(key, value);
    return `/explore/${params.category}?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <nav aria-label="탐색 경로" className="text-sm text-muted">
        <Link href="/explore" className="inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> 정보 탐색
        </Link>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{cat.name}</h1>
          <p className="mt-1 text-sm text-body">총 {items.length}건의 정보</p>
        </div>
      </header>

      {/* 카테고리 탭 */}
      <nav aria-label="카테고리" className="flex gap-1.5 overflow-x-auto pb-1 thin-scroll">
        {EXPLORE_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/explore/${c.slug}`}
            aria-current={c.slug === params.category ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3.5 py-2 text-sm font-medium",
              c.slug === params.category
                ? "bg-ink text-white"
                : "bg-strong text-body hover:text-ink"
            )}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {/* 필터/정렬 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-hairline bg-surface px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted">진행 상태</span>
          {[
            ["all", "전체"],
            ["open", "진행중"],
            ["deadline", "마감 예정"],
          ].map(([v, label]) => (
            <Link
              key={v}
              href={filterLink("status", v)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium",
                status === v ? "bg-primary/10 text-primary" : "text-body hover:text-ink"
              )}
            >
              {label}
            </Link>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted">정렬</span>
          {[
            ["latest", "최신순"],
            ["deadline", "마감 임박순"],
            ["title", "제목순"],
          ].map(([v, label]) => (
            <Link
              key={v}
              href={filterLink("sort", v)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium",
                sort === v ? "bg-primary/10 text-primary" : "text-body hover:text-ink"
              )}
            >
              {label}
            </Link>
          ))}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="조건에 맞는 정보가 없습니다"
          description="필터를 변경하거나 Chatmore에게 직접 질문해 보세요."
          action={
            <Link
              href={`/chat?q=${encodeURIComponent(`${cat.name} 관련 정보를 알려줘`)}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Chatmore에게 질문하기
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <InfoCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
