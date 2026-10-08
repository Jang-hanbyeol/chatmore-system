import { notFound } from "next/navigation";
import { db } from "@/lib/database/db";
import { InfoSourceForm } from "@/components/admin/InfoSourceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "데이터 수정" };

const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditDataPage({
  params,
}: {
  params: { id: string };
}) {
  const [item, categories] = await Promise.all([
    db.informationSource.findUnique({ where: { id: params.id } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold text-ink">데이터 수정</h1>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <InfoSourceForm
          categories={[
            ...new Set([item.category, ...categories.map((c) => c.name)]),
          ]}
          data={{
            id: item.id,
            title: item.title,
            category: item.category,
            summary: item.summary,
            content: item.content,
            department: item.department,
            targetUsers: item.targetUsers,
            keywords: item.keywords,
            sourceUrl: item.sourceUrl,
            startAt: dateInput(item.startAt),
            endAt: dateInput(item.endAt),
            dataStatus: item.dataStatus,
            isAiSearchable: item.isAiSearchable,
          }}
        />
      </div>
    </div>
  );
}
