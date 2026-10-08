import { db } from "@/lib/database/db";
import { AdminNoticeForm } from "@/components/admin/AdminNoticeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "새 공지 등록" };

export default async function NewNoticePage() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold text-ink">새 공지 등록</h1>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <AdminNoticeForm categories={categories.map((c) => c.name)} />
      </div>
    </div>
  );
}
