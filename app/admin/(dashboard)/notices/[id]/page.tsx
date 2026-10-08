import { notFound } from "next/navigation";
import { db } from "@/lib/database/db";
import { AdminNoticeForm } from "@/components/admin/AdminNoticeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "공지 수정" };

const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditNoticePage({
  params,
}: {
  params: { id: string };
}) {
  const [n, categories] = await Promise.all([
    db.notice.findUnique({ where: { id: params.id } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!n) notFound();
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold text-ink">공지 수정</h1>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <AdminNoticeForm
          categories={[...new Set([n.category, ...categories.map((c) => c.name)])]}
          data={{
            id: n.id,
            title: n.title,
            category: n.category,
            summary: n.summary,
            content: n.content,
            department: n.department,
            targetUsers: n.targetUsers,
            startAt: dateInput(n.startAt),
            endAt: dateInput(n.endAt),
            sourceUrl: n.sourceUrl,
            status: n.status,
            isPinned: n.isPinned,
          }}
        />
      </div>
    </div>
  );
}
