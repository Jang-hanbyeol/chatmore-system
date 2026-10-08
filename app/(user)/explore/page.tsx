import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  GraduationCap,
  LibraryBig,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { InfoCard } from "@/components/notice/InfoCard";
import { EXPLORE_CATEGORIES } from "@/lib/validation/schemas";
import { ddayLabel, kstToday } from "@/lib/utils";

export const metadata: Metadata = { title: "정보 탐색" };
export const dynamic = "force-dynamic";

const ICONS = [CalendarDays, Wallet, GraduationCap, LibraryBig, Building2];

const CATEGORY_GROUPS: Record<string, string[]> = {
  academic: ["학사정보"],
  scholarship: ["장학금"],
  programs: ["비교과 프로그램", "취업·창업"],
  "campus-life": ["도서관", "학생식당", "기숙사", "통학버스", "행사 및 공지"],
  facilities: ["교내 시설", "행정부서"],
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireOnboardedUser();
  const q = (searchParams.q ?? "").trim().slice(0, 100);

  const [counts, deadlines, results] = await Promise.all([
    db.informationSource.groupBy({
      by: ["category"],
      where: { dataStatus: "active" },
      _count: true,
    }),
    db.informationSource.findMany({
      where: { dataStatus: "active", endAt: { gte: kstToday() } },
      orderBy: { endAt: "asc" },
      take: 5,
    }),
    q
      ? db.informationSource.findMany({
          where: {
            dataStatus: "active",
            OR: [
              { title: { contains: q } },
              { summary: { contains: q } },
              { keywords: { contains: q } },
              { content: { contains: q } },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const countOf = (cats: string[]) =>
    counts
      .filter((c) => cats.includes(c.category))
      .reduce((a, c) => a + c._count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">정보 탐색</h1>
        <p className="mt-1.5 text-[0.9375rem] text-body">
          카테고리별로 대학 정보를 찾아보거나 검색해 보세요.
        </p>
      </header>

      {/* 통합 검색 */}
      <form action="/explore" method="get" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          정보 검색
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="예: 장학금, 수강신청, 기숙사"
          className="h-12 w-full max-w-lg rounded-md border border-hairline bg-surface px-4 text-[0.9375rem] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-md bg-primary px-5 font-semibold text-white hover:bg-primary-active"
        >
          검색
        </button>
      </form>

      {q ? (
        <section aria-label="검색 결과">
          <p className="mb-3 text-sm text-muted" role="status">
            “{q}” 검색 결과 {results.length}건
          </p>
          {results.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-surface p-10 text-center">
              <p className="font-semibold text-ink">관련 정보를 찾지 못했습니다.</p>
              <p className="mt-1.5 text-sm text-body">
                질문을 조금 더 구체적으로 입력하거나 담당 부서를 확인해 주세요.
              </p>
              <Link
                href={`/chat?q=${encodeURIComponent(q)}`}
                className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Chatmore에게 질문하기
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {results.map((r) => (
                <li key={r.id}>
                  <InfoCard item={r} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {/* 카테고리 */}
          <section aria-label="카테고리" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORE_CATEGORIES.map((c, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Link
                  key={c.slug}
                  href={`/explore/${c.slug}`}
                  className="group flex items-center gap-4 rounded-lg border border-hairline bg-surface p-5 transition-shadow hover:shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon size={21} className="text-primary" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-ink group-hover:text-primary">
                      {c.name}
                    </span>
                    <span className="text-xs text-muted">
                      정보 {countOf(CATEGORY_GROUPS[c.slug] ?? [])}건
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-muted" aria-hidden />
                </Link>
              );
            })}
          </section>

          {/* 마감 임박 */}
          <section aria-labelledby="deadline" className="rounded-lg border border-hairline bg-surface">
            <header className="border-b border-hairline-soft px-5 py-4">
              <h2 id="deadline" className="font-semibold text-ink">마감 임박 정보</h2>
            </header>
            {deadlines.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                마감 임박 정보가 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {deadlines.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Badge tone="amber">{ddayLabel(d.endAt)}</Badge>
                    <Link
                      href={`/chat?q=${encodeURIComponent(`${d.title}에 대해 알려줘`)}`}
                      className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink hover:text-primary"
                    >
                      {d.title}
                    </Link>
                    <span className="hidden text-xs text-muted sm:block">{d.department}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
