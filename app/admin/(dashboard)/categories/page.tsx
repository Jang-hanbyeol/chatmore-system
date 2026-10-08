import { db } from "@/lib/database/db";
import { deleteCategory } from "@/lib/actions/admin";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "카테고리 관리" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ink">카테고리 관리</h1>
        <p className="mt-1 text-sm text-body">
          대학 정보 데이터·공지에 사용되는 카테고리를 관리합니다.
        </p>
      </header>

      <section className="rounded-lg border border-hairline bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">새 카테고리 추가</h2>
        <CategoryForm />
      </section>

      <div className="rounded-lg border border-hairline bg-surface">
        <ul className="divide-y divide-hairline-soft">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
              <span className="w-8 font-mono text-xs text-muted">{c.sortOrder}</span>
              <span className="min-w-28 flex-1 font-medium text-ink">{c.name}</span>
              <StatusBadge status={c.isActive ? "active" : "archived"} />
              <details className="relative">
                <summary className="cursor-pointer list-none rounded-md px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                  수정
                </summary>
                <div className="mt-3 w-full rounded-md bg-soft p-4">
                  <CategoryForm category={c} />
                </div>
              </details>
              <form action={deleteCategory.bind(null, c.id)}>
                <ConfirmSubmit
                  confirmMessage={`「${c.name}」 카테고리를 삭제하시겠습니까?`}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-down hover:bg-down/10"
                >
                  삭제
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
