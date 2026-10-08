import Link from "next/link";
import { Pin } from "lucide-react";
import { db } from "@/lib/database/db";
import { deleteAdminNotice } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "공지사항 관리" };

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: { q?: string; saved?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const notices = await db.notice.findMany({
    where: q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] } : undefined,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-5">
      {searchParams.saved && (
        <p role="status" className="rounded-md bg-up/10 px-4 py-3 text-sm text-up">
          공지사항이 저장되었습니다.
        </p>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">공지사항 관리</h1>
          <p className="mt-1 text-sm text-body">학생 화면에 노출되는 공지를 관리합니다.</p>
        </div>
        <Link href="/admin/notices/new" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-active">
          새 공지 등록
        </Link>
      </header>

      <form action="/admin/notices" method="get" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">공지 검색</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="제목·요약 검색"
          className="h-10 w-64 rounded-md border border-hairline bg-surface px-3.5 text-sm focus:border-primary focus:outline-none"
        />
        <button type="submit" className="h-10 rounded-md bg-strong px-4 text-sm font-semibold text-ink hover:bg-hairline">
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">제목</th>
              <th className="px-3 py-3 font-semibold">카테고리</th>
              <th className="px-3 py-3 font-semibold">담당 부서</th>
              <th className="px-3 py-3 font-semibold">상태</th>
              <th className="px-3 py-3 font-semibold">등록일</th>
              <th className="px-3 py-3 font-semibold">조회</th>
              <th className="px-3 py-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {notices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  등록된 공지가 없습니다.
                </td>
              </tr>
            )}
            {notices.map((n) => (
              <tr key={n.id}>
                <td className="max-w-[300px] px-4 py-3">
                  <p className="flex items-center gap-1.5 truncate font-medium text-ink">
                    {n.isPinned && <Pin size={12} className="shrink-0 text-primary" aria-label="고정" />}
                    {n.title}
                  </p>
                </td>
                <td className="px-3 py-3 text-body">{n.category}</td>
                <td className="px-3 py-3 text-body">{n.department}</td>
                <td className="px-3 py-3"><StatusBadge status={n.status} /></td>
                <td className="px-3 py-3 text-body">{formatDate(n.createdAt)}</td>
                <td className="px-3 py-3 font-mono text-body">{n.viewCount}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/notices/${n.id}`} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                      수정
                    </Link>
                    <form action={deleteAdminNotice.bind(null, n.id)}>
                      <ConfirmSubmit
                        confirmMessage={`「${n.title}」 공지를 삭제하시겠습니까?`}
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
