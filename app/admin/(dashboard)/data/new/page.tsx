import { db } from "@/lib/database/db";
import { InfoSourceForm } from "@/components/admin/InfoSourceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "새 데이터 등록" };

export default async function NewDataPage() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold text-ink">새 대학 정보 데이터</h1>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <InfoSourceForm categories={categories.map((c) => c.name)} />
      </div>
    </div>
  );
}
