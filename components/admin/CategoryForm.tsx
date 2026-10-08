"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveCategory } from "@/lib/actions/admin";
import type { FormState } from "@/lib/actions/auth";
import { inputCls } from "@/components/ui/Field";

const initial: FormState = { ok: false, message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-active disabled:bg-primary-disabled"
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function CategoryForm({
  category,
}: {
  category?: { id: string; name: string; sortOrder: number; isActive: boolean };
}) {
  const [state, formAction] = useFormState(saveCategory, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`w-full text-sm ${state.ok ? "text-up" : "text-down"}`}
        >
          {state.message}
        </p>
      )}
      {category && <input type="hidden" name="id" value={category.id} />}
      <label className="text-sm">
        <span className="block text-xs font-semibold text-muted">이름</span>
        <input
          name="name"
          required
          defaultValue={category?.name}
          className={`${inputCls()} mt-1 h-10 w-44`}
        />
      </label>
      <label className="text-sm">
        <span className="block text-xs font-semibold text-muted">순서</span>
        <input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={category?.sortOrder ?? 0}
          className={`${inputCls()} mt-1 h-10 w-20`}
        />
      </label>
      <label className="flex h-10 items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="h-4 w-4 accent-[#0052ff]"
        />
        사용
      </label>
      <SubmitButton label={category ? "수정" : "추가"} />
    </form>
  );
}
