import { db } from "@/lib/database/db";
import { PendingButton } from "@/components/ui/PendingButton";
import { updateUserStatus } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "사용자 관리" };

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { conversations: true } },
    },
  });
  const questionCounts = await db.message.groupBy({
    by: ["conversationId"],
    where: { role: "user" },
    _count: true,
  });
  const convOwners = await db.conversation.findMany({
    select: { id: true, userId: true },
  });
  const ownerOf = new Map(convOwners.map((c) => [c.id, c.userId]));
  const perUser = new Map<string, number>();
  for (const qc of questionCounts) {
    const uid = ownerOf.get(qc.conversationId);
    if (uid) perUser.set(uid, (perUser.get(uid) ?? 0) + qc._count);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">사용자 관리</h1>
        <p className="mt-1 text-sm text-body">
          개인 질문 내용은 개인정보 정책에 따라 이 화면에 노출하지 않습니다.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">사용자</th>
              <th className="px-3 py-3 font-semibold">유형</th>
              <th className="px-3 py-3 font-semibold">학과</th>
              <th className="px-3 py-3 font-semibold">학년</th>
              <th className="px-3 py-3 font-semibold">가입일</th>
              <th className="px-3 py-3 font-semibold">최근 이용</th>
              <th className="px-3 py-3 font-semibold">질문 수</th>
              <th className="px-3 py-3 font-semibold">상태</th>
              <th className="px-3 py-3 font-semibold">변경</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {u.name}
                    {u.isDemo && (
                      <span className="ml-1.5 rounded-sm bg-strong px-1.5 py-0.5 text-[0.625rem] font-bold text-muted">
                        DEMO
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-3 py-3 text-body">{u.userType}</td>
                <td className="px-3 py-3 text-body">{u.department ?? "-"}</td>
                <td className="px-3 py-3 text-body">{u.grade ?? "-"}</td>
                <td className="px-3 py-3 text-body">{formatDate(u.createdAt)}</td>
                <td className="px-3 py-3 text-body">{formatDate(u.lastActiveAt)}</td>
                <td className="px-3 py-3 font-mono text-body">{perUser.get(u.id) ?? 0}</td>
                <td className="px-3 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-3 py-3">
                  <form action={updateUserStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="status"
                      defaultValue={u.status}
                      className="h-8 rounded-md border border-hairline bg-surface px-2 text-xs focus:border-primary focus:outline-none"
                      aria-label={`${u.name} 계정 상태`}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                    <PendingButton className="rounded-md bg-strong px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-hairline disabled:opacity-60">
                      저장
                    </PendingButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
