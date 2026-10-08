import Link from "next/link";
import { db } from "@/lib/database/db";
import { deleteInfoSource } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { DATA_STATUS_LABELS, formatDate } from "@/lib/utils";
import { DATA_STATUSES } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "대학 정보 데이터" };

export default async function AdminDataPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; saved?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status;
  const items = await db.informationSource.findMany({
    where: {
      ...(status ? { dataStatus: status } : {}),
      ...(q
        ? { OR: [{ title: { contains: q } }, { keywords: { contains: q } }] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      {searchParams.saved && (
        <p role="status" className="rounded-md bg-up/10 px-4 py-3 text-sm text-up">
          대학 정보 데이터가 저장되었습니다.
        </p>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">대학 정보 데이터</h1>
          <p className="mt-1 text-sm text-body">
            챗봇이 검색하는 RAG 데이터를 등록·관리합니다.
          </p>
        </div>
        <Link href="/admin/data/new" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-active">
          새 데이터 등록
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/data" method="get" role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">데이터 검색</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="제목·키워드 검색"
            className="h-10 w-64 rounded-md border border-hairline bg-surface px-3.5 text-sm focus:border-primary focus:outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="h-10 rounded-md bg-strong px-4 text-sm font-semibold text-ink hover:bg-hairline">
            검색
          </button>
        </form>
        <nav aria-label="상태 필터" className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/data"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold",
              !status ? "bg-ink text-white" : "bg-strong text-body"
            )}
          >
            전체
          </Link>
          {DATA_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/data?status=${s}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold",
                status === s ? "bg-ink text-white" : "bg-strong text-body"
              )}
            >
              {DATA_STATUS_LABELS[s]}
            </Link>
          ))}
        </nav>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">제목</th>
              <th className="px-3 py-3 font-semibold">카테고리</th>
              <th className="px-3 py-3 font-semibold">담당 부서</th>
              <th className="px-3 py-3 font-semibold">상태</th>
              <th className="px-3 py-3 font-semibold">AI 검색</th>
              <th className="px-3 py-3 font-semibold">데이터 기준일</th>
              <th className="px-3 py-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  조건에 맞는 데이터가 없습니다.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td className="max-w-[280px] px-4 py-3">
                  <p className="truncate font-medium text-ink">{s.title}</p>
                  {s.sourceUrl && (
                    <p className="truncate text-xs text-muted">{s.sourceUrl}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-body">{s.category}</td>
                <td className="px-3 py-3 text-body">{s.department}</td>
                <td className="px-3 py-3"><StatusBadge status={s.dataStatus} /></td>
                <td className="px-3 py-3 text-body">{s.isAiSearchable ? "포함" : "제외"}</td>
                <td className="px-3 py-3 text-body">{formatDate(s.dataCheckedAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/data/${s.id}`} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                      수정
                    </Link>
                    <form action={deleteInfoSource.bind(null, s.id)}>
                      <ConfirmSubmit
                        confirmMessage={`「${s.title}」 데이터를 삭제하시겠습니까?`}
                        className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-down hover:bg-down/10"
                      >
                        삭제
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
